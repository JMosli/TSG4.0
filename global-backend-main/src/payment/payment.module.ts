import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaService } from 'src/helpers/prisma.service';
import { PaymentWebhookService } from './webhook.service';
import { RangeModule } from 'src/range/range.module';
import { MailingModule } from 'src/mailing/mailing.module';
import { FileModule } from 'src/file/file.module';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, PaymentWebhookService, PrismaService],
  imports: [RangeModule, MailingModule, FileModule],
  exports: [PaymentService],
})
export class PaymentModule {}
