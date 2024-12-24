import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { AuthErrors } from '../types';
import { ALLOW_UNAUTHORIZED_KEY } from 'src/helpers/allow-unauthorized.decorator';

/**
 * Requires request to be authorized by the bearer token.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowUnauthorized = this.reflector.getAllAndOverride<boolean>(
      ALLOW_UNAUTHORIZED_KEY,
      [context.getHandler(), context.getClass()],
    );
    const request: Request = context.switchToHttp().getRequest();
    const token = this.getToken(request);

    if (!token && allowUnauthorized) return true;
    if (!token) throw new UnauthorizedException(AuthErrors.NoToken);

    try {
      const payload = await this.jwtService.verifyAsync<{
        user?: number;
      }>(token);
      if (!payload.user) throw new UnauthorizedException(AuthErrors.WrongToken);

      const user = await this.usersService.findOne(
        { id: payload.user },
        {
          include: {
            security_guard_of: { select: { id: true } },
            owner_of: { select: { id: true } },
          },
        },
      );
      if (!user) throw new UnauthorizedException(AuthErrors.NotFound);

      request['user'] = { ...user, password: undefined };
    } catch (e) {
      if (allowUnauthorized) return true;

      throw new UnauthorizedException(AuthErrors.WrongToken);
    }

    return true;
  }

  private getToken(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
