import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/helpers/prisma.service';
import Stripe from 'stripe';
import { CreateCheckoutLinkDto } from './dto/create-checkout-link.dto';
import { Prisma } from '@prisma/client';
import { PaymentErrors } from './constants';
import { PaginateDto } from 'src/helpers/paginate/types';
import { RangeService } from 'src/range/range.service';
import { JwtService } from '@nestjs/jwt';
import { BuyMediaDto } from './dto/buy-media.dto';
import { CryptoService } from 'src/crypto/crypto.service';

@Injectable()
export class PaymentService {
  public stripe: Stripe = new Stripe(process.env.STRIPE_SECRET);

  constructor(
    private prisma: PrismaService,
    private readonly rangeService: RangeService,
    private readonly cryptoService: CryptoService,
  ) {
    if (!process.env.STRIPE_SECRET) throw new Error('Stripe key was not found');
  }

  async createTerminalIntent(rangeId: number, payload: CreateCheckoutLinkDto) {
    let intentId = '';

    // we have to reuse the same intent id, for example,
    // to let client to try a new card and not receiving
    // double charge
    const existingIntent = await this.findOne({
      rangeId,
      range_session_uid: payload.session_uid,
      active: true,
    }).catch(() => null);

    if (!existingIntent) {
      const intent = await this.stripe.paymentIntents.create({
        currency: 'usd',
        payment_method_types: ['card_present'],
        capture_method: 'automatic',
        amount: payload.price,
      });
      intentId = intent.id;
    } else {
      if (!existingIntent.active)
        throw new ConflictException(PaymentErrors.NotActive);

      intentId = existingIntent.checkout_id;
    }

    const reader = await this.stripe.terminal.readers.processPaymentIntent(
      payload.reader_id,
      { payment_intent: intentId },
    );

    const payment = await this.prisma.payment.create({
      data: {
        active: true,
        url: '',
        checkout_id: intentId,
        invoice_id: '',
        email: payload.email,
        range_session_uid: payload.session_uid,
        price: payload.price,
        range: {
          connect: {
            id: rangeId,
          },
        },
      },
    });

    return payment;
  }

  /**
   * Creates a checkout link for user to pay
   * @param videoId id of the video on the local server
   */
  async createCheckoutLink(rangeId: number, payload: CreateCheckoutLinkDto) {
    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'USD',
            unit_amount: payload.price,
            product_data: {
              name: `Your shooting videos`,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: payload.email,
      mode: 'payment',
      success_url: process.env.PAYMENT_SUCC_URL,
      cancel_url: process.env.PAYMENT_ERR_URL,
    });

    const payment = await this.prisma.payment.create({
      data: {
        active: true,
        email: payload.email,
        url: session.url,
        checkout_id: session.id,
        invoice_id: '',
        range_session_uid: payload.session_uid,
        price: payload.price,
        range: {
          connect: {
            id: rangeId,
          },
        },
      },
    });

    return payment;
  }

  async createPayment(rangeId: number, payload: CreateCheckoutLinkDto) {
    if (payload.reader_id) {
      const terminal = await this.stripe.terminal.readers.retrieve(
        payload.reader_id,
      );
      if (!terminal || terminal.deleted || !terminal.id)
        throw new NotFoundException();

      return this.createTerminalIntent(rangeId, payload);
    }

    return this.createCheckoutLink(rangeId, payload);
  }

  /**
   * Handles a procedure of buying a single media
   */
  async buySingleMedia({ token, email }: BuyMediaDto) {
    if (!token.includes('|'))
      throw new BadRequestException(PaymentErrors.BadToken);

    // so the token format is:
    // {range_id}|{base64url(json)}.{base64url(signature(base64url(json)))}
    const [rangeId, payload] = token.split('|');
    if (isNaN(+rangeId)) throw new BadRequestException(PaymentErrors.BadToken);

    const range = await this.rangeService.findOne({ where: { id: +rangeId } });
    if (!range) throw new BadRequestException(PaymentErrors.BadToken);

    const [json, signature] = payload.split('.');
    if (!json || !signature)
      throw new BadRequestException(PaymentErrors.BadToken);

    // and then check a signature by using a public key
    // (private key is used on the range to create this signature)
    const verified = this.cryptoService.verifySignature(
      json,
      Buffer.from(signature, 'base64url'),
      Buffer.from(range.public_key_checker),
    );
    if (!verified) throw new BadRequestException(PaymentErrors.BadToken);

    const info: { cid: number; vid: number } | { cid: number; p: string } =
      JSON.parse(Buffer.from(json, 'base64url').toString());

    if (!info || !info.cid || !('vid' in info || 'p' in info))
      throw new BadRequestException(PaymentErrors.BadToken);

    console.log(info);

    // creating a session
    const communicator = this.rangeService.getRangeCommunicator(range);
    const response = await communicator.payment.create({
      email,
      client_ids: [info.cid],
      photos: 'p' in info ? [{ client_id: info.cid, timestamp: +info.p }] : [],
      video_ids: 'vid' in info ? [info.vid] : [],
    });
    const [data, error] = response.transpose();
    if (error) throw new InternalServerErrorException();

    return data;
  }

  /**
   * Finds a payment in the database
   * @throws {NotFoundException} if payment was not found
   */
  async findOne(
    where: Prisma.PaymentWhereInput,
    opts: Partial<Prisma.PaymentFindFirstArgs> = {},
  ) {
    const payment = await this.prisma.payment.findFirst({
      where,
      ...opts,
    });
    if (!payment) throw new NotFoundException(PaymentErrors.PaymentNotFound);

    return payment;
  }

  /**
   * Finds all payments in the database
   * with the matching parameters
   */
  find(where: Prisma.PaymentWhereInput, pagination?: PaginateDto) {
    return this.prisma.payment.findMany({
      where,
      ...pagination,
    });
  }

  /**
   * Updates a payment in the database
   */
  update(where: Prisma.PaymentWhereInput, data: Prisma.PaymentUpdateInput) {
    return this.prisma.payment.updateMany({
      where,
      data,
    });
  }
}
