import {
  BadRequestException,
  Injectable,
  StreamableFile,
} from '@nestjs/common';
import { RangeService } from './range.service';
import { RangeErrors } from './constants';
import { UserContext } from 'src/auth/types';
import { RangeCommunicator } from './range-communicator';
import type { Prisma, Range } from '@prisma/client';
import { Request } from 'express';
import axios from 'axios';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/helpers/prisma.service';

@Injectable()
export class RangeProxyService {
  constructor(
    private prisma: PrismaService,
    private readonly rangeService: RangeService,
  ) {}

  /**
   * Extracts range api path from our path.
   * Assumes that request is being done to /range/:id/api/(path)
   *
   * @param path our server path
   * @returns range server api path
   * @throws {BadRequestException} if path is wrong
   */
  extractPath(path: string) {
    // TODO: Find another way of making this shit
    // This is bad af...
    const pathMatcher = path.match(/range\/(\d+)\/api(\/(.+))/);
    if (!pathMatcher?.at?.(2))
      throw new BadRequestException(RangeErrors.WrongPath);

    // 0'th group is an entire string
    // 1'st is an id
    // 2'd is path
    // 3'd is path without slash
    return pathMatcher.at(2);
  }

  /**
   * Proxies request to the range.
   * @param user user to send to the specified range
   * @param range range to communicate with
   * @param req request being done to our server
   * @param payload payload being sent to our server
   * @returns range response
   */
  async proxyToRange(
    user: UserContext | null,
    range: Range,
    req: Request,
    payload: object,
  ) {
    const communicator = this.rangeService.getRangeCommunicator(range);
    const fullUser = await this.prisma.user.findFirst({
      where: {
        id: user.id,
        OR: [
          { security_guard_of: { some: { id: range.id } } },
          { owner_of: { some: { id: range.id } } },
        ],
      },
      include: { security_guard_of: true, owner_of: true },
    });
    const path = this.extractPath(req.url);
    const filteredPayload = { ...payload, _internal: undefined };

    const isOwner = fullUser.owner_of.some((r) => r.id === range.id);
    const isSG = fullUser.security_guard_of.some((r) => r.id === range.id);

    const response = await this.rangeService.proxyToRange(
      { ...user, is_owner: isOwner, is_sg: isSG },
      communicator,
      {
        url: path,
        method: req.method,
        data: filteredPayload,
      },
    );

    return response.response;
  }

  /**
   * Gets a response from range as a stream and streams it into
   * global backend response (needed for videos or other buffer contend)
   */
  async restreamResponse(range: Range, url: string, request: Request) {
    const rangeUrl = new URL(url, range.ip_address);

    const response = await axios.request({
      method: request.method,
      headers: request.headers,
      url: rangeUrl.toString(),
      data: request.body,
      params: request.query,
      responseType: 'stream',
    });

    return { stream: new StreamableFile(response.data), response };
  }
}
