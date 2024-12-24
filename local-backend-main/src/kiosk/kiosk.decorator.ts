import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Kiosk as KioskType } from '@prisma/client';

export type KioskContext = KioskType;

export const Kiosk = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.kiosk;
  },
);
