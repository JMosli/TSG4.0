import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Range } from '@prisma/client';
import { CreateRangeDto } from './dto/create-range.dto';
import { generateKeyPairSync, KeyObject } from 'crypto';
import { RangeErrors } from './constants';
import { PrismaService } from 'src/helpers/prisma.service';
import { RangeCommunicator } from './range-communicator';
import { CryptoService } from 'src/crypto/crypto.service';
import { UserContext } from 'src/auth/types';
import { CommunicatorRequester } from 'communicator/requester';
import { UpdateRangeDto } from './dto/update-range.dto';
import { PaginateDto } from 'src/helpers/paginate/types';

@Injectable()
export class RangeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates instance of RangeCommunicator with all needed parameters
   * @param range range to get values from
   * @returns range communicator
   */
  getRangeCommunicator(range: Range) {
    const requester = new CommunicatorRequester({
      signerKey: range.private_key_signer,
      checkerKey: range.public_key_checker,
      baseURL: range.ip_address,
      rangeId: range.id.toString(),
    });
    const communicator = new RangeCommunicator(requester);

    return communicator;
  }

  /**
   * Finds all ranges from the database with matching parameters
   * @returns found ranges
   */
  findRanges(where: Prisma.RangeWhereInput, { skip, take }: PaginateDto) {
    return this.prisma.$transaction([
      this.prisma.range.count({ where }),
      this.prisma.range.findMany({
        where,
        skip,
        take,
      }),
    ]);
  }

  /**
   * Finds first range with matching parameters
   * @param options prisma findFirst options
   * @returns range or null
   */
  findOne(options: Prisma.RangeFindFirstArgs) {
    return this.prisma.range.findFirst(options);
  }

  /**
   * Updates one range.
   * @param rangeId id of the range to update
   * @param payload new range data
   * @returns updated range
   */
  async updateRange(
    user: UserContext,
    rangeId: number,
    payload: UpdateRangeDto,
  ) {
    /**
     * Transform a payload with format { connect: [1, 2, 3] } in
     * prisma format like { connect: [{ id: 1 }, { id: 2 }, { id: 3 }] }
     * @param users payload to transfor,
     * @returns transformed payload
     */
    const transformConnect = (users: {
      connect?: number[];
      disconnect?: number[];
    }) => ({
      connect:
        users.connect?.map((v) => ({
          id: +v,
          create_by_userId: user.is_global_admin ? undefined : user.id,
        })) ?? undefined,
      disconnect:
        users.disconnect?.map((v) => ({
          id: +v,
          create_by_userId: user.is_global_admin ? undefined : user.id,
        })) ?? undefined,
    });

    if (payload.owners?.disconnect?.some((id) => id === user.id))
      throw new ConflictException(RangeErrors.CannotRemoveYourself);

    return this.prisma.range.update({
      where: { id: rangeId },
      data: {
        name: payload.name,
        owners: payload.owners ? transformConnect(payload.owners) : undefined,
        security_guards: payload.security_guards
          ? transformConnect(payload.security_guards)
          : undefined,
      },
      include: {
        owners: true,
        security_guards: true,
      },
    });
  }

  /**
   * Creates a range entry in the database generating key pair
   * @param payload options for creating a range
   * @returns created range
   * @throws {NotFoundException} is owner user was not found
   */
  async complexCreateRange(payload: CreateRangeDto) {
    const ownerUser = await this.prisma.user.findFirst({
      where: { id: payload.owner_user_id },
    });
    if (!ownerUser) throw new NotFoundException(RangeErrors.UserNotFound);

    const existingRange = await this.prisma.range.findFirst({
      where: {
        ip_address: payload.ip_address,
      },
    });
    if (existingRange)
      throw new ConflictException(RangeErrors.RangeCreationError);

    // There are 2 key pairs:
    // 1. For range to sign its requests and for us to check them
    // 2. For us to sign requests to the range and for range to check them
    const rangeKeyPair = generateKeyPairSync('ed25519');
    const localKeyPair = generateKeyPairSync('ed25519');

    // As we can only export private keys using pkcs8 and public keys using spki
    // we need to different options to do this and not trash a code
    const exportPublic = (key: KeyObject) =>
      key.export({ type: 'spki', format: 'pem' }).toString();

    const exportPrivate = (key: KeyObject) =>
      key.export({ type: 'pkcs8', format: 'pem' }).toString();

    const private_key_range = exportPrivate(rangeKeyPair.privateKey);
    const public_key_range = exportPublic(localKeyPair.publicKey);

    const private_key_signer = exportPrivate(localKeyPair.privateKey);
    const public_key_checker = exportPublic(rangeKeyPair.publicKey);

    return this.prisma.range.create({
      data: {
        name: payload.name,
        ip_address: payload.ip_address,

        owners: {
          connect: ownerUser,
        },

        private_key_range,
        public_key_range,

        private_key_signer,
        public_key_checker,
      },
    });
  }

  /**
   * Completely removes range from the system:
   *  1. Removes global server side range
   *  2. Removes local server side range
   *
   * After that operation both local server and global server would not
   * process all things related to the deleted range.
   * @param user user deleting range
   * @returns deleted on the local server range
   * @throws {NotFoundException} if range was not found
   */
  async removeRange(user: UserContext, rangeId: number) {
    const range = await this.findOne({
      where: {
        id: rangeId,
        owners: !user.is_global_admin ? { some: { id: user.id } } : undefined,
      },
    });
    if (!range) throw new NotFoundException(RangeErrors.RangeNotFound);

    const communicator = this.getRangeCommunicator(range);

    // Removing global server side range
    await this.prisma.range.delete({ where: { id: rangeId } });

    // Notifying local server that the range was removed on the global server side,
    // so it will remove it's own range database entry
    const rangeResponse = await communicator.range
      .removeRange(rangeId, user)
      .catch(() => ({ response: null }));

    return {
      ok: true,
      rangeResponse: rangeResponse.response,
    };
  }

  /**
   * Sets up keys and other things on the specified range
   * @param range range to setup
   */
  async setupRange(range: Range, communicator: RangeCommunicator) {
    return await communicator.setup.createRange({
      privateKey: range.private_key_range,
      publicKey: range.public_key_range,
      rangeId: range.id,
    });
  }

  /**
   * Proxies request to the specified range.
   * @param user user to send to the range
   * @param options request options
   * @returns range response
   */
  async proxyToRange(
    user: UserContext & { is_owner: boolean; is_sg: boolean },
    communicator: RangeCommunicator,
    options: { url: string; method: string; data: object },
  ) {
    return communicator.requester.apiRequest(options.url, {
      data: {
        ...options.data,
        _internal: { user },
      },
      method: options.method,
    });
  }

  /**
   * Returns a range without some secret fields
   */
  filterFields(range: Range) {
    return {
      ...range,
      private_key_signer: undefined,
      private_key_range: undefined,
    };
  }

  /**
   * Builds a database filter to filter access
   */
  buildFilter(user: UserContext) {
    return !user.is_global_admin
      ? {
          OR: [
            { owners: { some: { id: user.id } } },
            { security_guards: { some: { id: user.id } } },
          ],
        }
      : undefined;
  }
}
