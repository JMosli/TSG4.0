import { Module } from '@nestjs/common';
import { PhotoService } from './photo.service';
import { PhotoController } from './photo.controller';
import { RangeService } from 'src/range/range.service';
import { LocalFileService } from 'src/file/local-file.service';
import { PrismaService } from 'src/helpers/prisma.service';
import { RangeModule } from 'src/range/range.module';
import { PaymentModule } from 'src/payment/payment.module';

@Module({
  controllers: [PhotoController],
  providers: [PhotoService, RangeService, LocalFileService, PrismaService],
  imports: [RangeModule, PaymentModule],
})
export class PhotoModule {}
