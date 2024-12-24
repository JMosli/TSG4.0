import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  Body,
  Req,
  RawBodyRequest,
  Get,
  Param,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { SignerInterceptor } from 'src/range/signature-manager/response-signer.interceptor';
import { RangeGuard } from 'src/range/signature-manager/range-request.guard';
import { CreateCheckoutLinkDto } from './dto/create-checkout-link.dto';
import { Range } from 'src/range/range.decorator';
import { RangeContext } from 'src/range/constants';
import { Request } from 'express';
import { PaymentWebhookService } from './webhook.service';
import { PaymentErrors } from './constants';
import { GlobalAdminGuard } from 'src/auth/guards/global-admin.guard';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { MaxTake } from 'src/helpers/paginate/max-take.decorator';
import { PaginateDto } from 'src/helpers/paginate/types';
import { BuyMediaDto } from './dto/buy-media.dto';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly webhookService: PaymentWebhookService,
  ) {}

  @Post('stripe/webhook')
  webhook(@Req() req: RawBodyRequest<Request>) {
    return this.webhookService.handle(req);
  }

  /**
   * Used by a local server to initiate a payment session
   */
  @UseInterceptors(SignerInterceptor)
  @UseGuards(RangeGuard)
  @Post('create_payment')
  createPayment(
    @Range() range: RangeContext,
    @Body() payload: CreateCheckoutLinkDto,
  ) {
    return this.paymentService.createPayment(range.id, payload);
  }

  /**
   * Returns a paginated list of all payments
   */
  @Get('all')
  @MaxTake(20)
  @UseGuards(AuthGuard, GlobalAdminGuard)
  list(@Query() pagination: PaginateDto) {
    return this.paymentService.find({}, pagination);
  }

  /**
   * Handles a procedure of buying a single video by
   * scanning a qr code on tv
   */
  @Post('buy_media')
  buyMedia(@Body() payload: BuyMediaDto) {
    return this.paymentService.buySingleMedia(payload);
  }

  /**
   * Used by video selector after payment
   */
  @Get(':uid')
  async retrieve(@Param('uid') uid: string) {
    const payment = await this.paymentService.findOne(
      { uid },
      {
        include: {
          Video: { select: { uid: true } },
          Photo: { select: { uid: true } },
        },
      },
    );
    if (!payment) throw new NotFoundException(PaymentErrors.PaymentNotFound);

    return {
      ...payment,
      //@ts-expect-error
      video: payment.active ? undefined : payment.Video,
      //@ts-expect-error
      photo: payment.active ? undefined : payment.Photo,
      Video: undefined,
      Photo: undefined,
      range_session_id: undefined,
      id: undefined,
    };
  }
}
