import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';
import { PaymentService } from './payment.service';
import { PaymentErrors } from './constants';
import { RangeService } from 'src/range/range.service';
import { CheckoutCompletedEvent } from './types';
import { MailingService } from 'src/mailing/mailing.service';
import { wait } from 'src/utils';
import { PrismaService } from 'src/helpers/prisma.service';
import { LocalFileService } from 'src/file/local-file.service';

@Injectable()
export class PaymentWebhookService {
  constructor(
    private prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly rangeService: RangeService,
    private readonly mailingService: MailingService,
    private readonly fileService: LocalFileService,
  ) {
    if (!process.env.WHSEC)
      throw new Error('No WHSEC found in the environment');
  }

  /**
   * Checks and decodes an event coming from stripe
   */
  getEvent(req: RawBodyRequest<Request>): Stripe.Event | null {
    const sig = req.headers['stripe-signature'];
    if (!sig) return null;

    try {
      return this.paymentService.stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        process.env.WHSEC,
      );
    } catch (e) {
      return null;
    }
  }

  /**
   * Handles a stripe webhook request
   */
  async handle(req: RawBodyRequest<Request>) {
    const event = this.getEvent(req);
    if (!event) throw new BadRequestException(PaymentErrors.WebhookAccessError);

    if (event.type === 'payment_intent.succeeded')
      return this.handlePaymentIntentSuccess(event);

    return { success: true };
  }

  /**
   * Handles payment_intent.succeeded event
   * @throws {BadRequestException} if metadata type is not what needed
   * @throws {NotFoundException} if payment or range were not found
   */
  private async handlePaymentIntentSuccess(
    event: Stripe.PaymentIntentSucceededEvent,
  ) {
    const intent = event.data.object;

    // getting payment and range for later process procedure
    const intentSessions =
      await this.paymentService.stripe.checkout.sessions.list({
        payment_intent: intent.id,
      });
    const payment = await this.paymentService.findOne({
      checkout_id:
        intentSessions.data.length > 0 ? intentSessions.data[0].id : intent.id,
    });
    const range = await this.rangeService.findOne({
      where: { id: payment.rangeId },
    });
    if (!range) throw new NotFoundException(PaymentErrors.PaymentNotFound);
    if (!payment.active) throw new ConflictException(PaymentErrors.NotActive);

    // now we need to send an event to the range notifying it
    // that payment was successful and user can leave now
    const communicator = this.rangeService.getRangeCommunicator(range);
    const rangeResponse =
      await communicator.payment.sendWebhookEvent<CheckoutCompletedEvent>({
        type: 'checkout.session.completed',
        data: {
          session_uid: payment.range_session_uid,
          global_session_uid: payment.uid,
        },
      });
    const [resp, error] = rangeResponse.transpose();

    // we expect from range server to respond with success: true
    if (!resp?.success || error)
      throw new InternalServerErrorException(PaymentErrors.WebhookRangeError);

    const [emailText, emailTextErr] = await communicator.range
      .getConfigKey<string>('payment.email.thank_you_text')
      .then((res) => res.transpose());

    // and finally marking a payment as comleted
    await this.paymentService.update({ id: payment.id }, { active: false });

    this.generateEmail(payment.id, emailTextErr ? null : emailText.value);

    return { success: true };
  }

  /**
   * Generates an email to send to a user after
   * payment session completes
   */
  async generateEmail(paymentId: number, emailText: string | null) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId },
      include: {
        Photo: true,
        Video: true,
      },
    });
    const link = `${process.env.FRONTEND_URL}/payment/${payment.uid}`;

    //prettier-ignore
    const generateMediaInfo = (
      data: Array<{ uid: string; fileId: number }>,
      prefix: string,
      download = true
    ) =>
      Promise.all(
        data.map(async (e, idx) => ({
          name: `${prefix} ${idx + 1}`,
          url: `${process.env.SERVER_URL}/${prefix}/${e.uid}/${prefix}?download=${download ? "true" : "false"}`,
          size: ((await this.fileService.stat(e.fileId)).size / 1024 ** 2).toFixed(2) + " MiB",
        })),
      );

    await this.mailingService.createMessage({
      to: [payment.email],
      subject: 'Your purchased media',
      html: this.mailingService.renderTemplate('media.hbs', {
        text: emailText
          ? emailText.replace('{link}', link)
          : `Use this link to access your media: ${link}`,
        media: [
          ...(await generateMediaInfo(payment.Video, 'video')),
          ...(await generateMediaInfo(payment.Photo, 'photo', false)),
        ],
      }),
    });
  }
}
