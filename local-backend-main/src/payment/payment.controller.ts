import { OrGuard } from '@nest-lab/or-guard';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GlobalRequestGuard } from 'src/global-server/signature-manager/global-server.guard';
import { SignerInterceptor } from 'src/global-server/signature-manager/response-signer.interceptor';
import { MaxTake } from 'src/helpers/paginate/max-take.decorator';
import { PaginateDto } from 'src/helpers/paginate/types';
import { Kiosk, KioskContext } from 'src/kiosk/kiosk.decorator';
import { KioskRequestGuard } from 'src/kiosk/kiosk.guard';
import { CreateSessionDto } from './dto/create-session.dto';
import { WebhookDto } from './dto/webhook.dto';
import { PaymentService } from './payment.service';
import { WebhookEvent } from './types';

@UseInterceptors(SignerInterceptor)
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Receives a data about payment events
   */
  @UseGuards(GlobalRequestGuard)
  @Post('webhook')
  webhook(@Body() payload: WebhookDto) {
    console.log('got webhook');
    return this.paymentService.handleWebhook(payload as WebhookEvent);
  }

  /**
   * Creates new payment session
   */
  @Post('create_session')
  @UseGuards(OrGuard([KioskRequestGuard, GlobalRequestGuard]))
  createSession(
    @Body() payload: CreateSessionDto,
    @Kiosk() kiosk?: KioskContext | undefined,
  ) {
    return this.paymentService.createSession(payload, kiosk?.id);
  }

  /**
   * Used to get all sessions in the database
   */
  @Get('sessions')
  @UseGuards(OrGuard([KioskRequestGuard, GlobalRequestGuard]))
  @MaxTake(20)
  getSessions(@Query() paginate: PaginateDto) {
    return this.paymentService.findSessions({}, paginate);
  }
}
