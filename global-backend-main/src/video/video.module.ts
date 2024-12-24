import { Module } from '@nestjs/common';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { RangeService } from 'src/range/range.service';
import { RangeModule } from 'src/range/range.module';
import { PrismaService } from 'src/helpers/prisma.service';
import { LocalFileService } from '../file/local-file.service';
import { MulterModule } from '@nestjs/platform-express';
import { setupSettings } from 'src/setup/constants';
import { VideoAdminController } from './admin.controller';
import { PaymentModule } from 'src/payment/payment.module';

@Module({
  providers: [VideoService, RangeService, LocalFileService, PrismaService],
  controllers: [VideoController, VideoAdminController],
  imports: [
    RangeModule,
    PaymentModule,
    MulterModule.register({ dest: setupSettings.TEMP_PATH }),
  ],
})
export class VideoModule {}
