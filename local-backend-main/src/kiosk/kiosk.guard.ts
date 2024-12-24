import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RangeService } from 'src/range/range.service';
import { KioskService } from './kiosk.service';

/**
 * This guard implements access key checking to ensure
 * that request is coming from a kiosk
 */
@Injectable()
export class KioskRequestGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly rangeService: RangeService,
    private readonly kioskService: KioskService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );
    const auth = request.headers['authorization'];
    const token = auth.split(' ')?.at(1);

    if (!isPublic && !token) return false;

    const range = await this.rangeService.getDefault();
    if (!range) return false;

    const kiosk = await this.kioskService.findOne({ access_key: token });

    if (kiosk) request['kiosk'] = { ...kiosk };

    return isPublic || !!kiosk;
  }
}
