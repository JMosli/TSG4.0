import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SetupModule } from './setup/setup.module';
import { RangeModule } from './range/range.module';
import { CryptoModule } from './crypto/crypto.module';
import { VideoModule } from './video/video.module';
import { FileModule } from './file/file.module';
import { PaymentModule } from './payment/payment.module';
import { StatisticsModule } from './statistics/statistics.module';
import { PhotoModule } from './photo/photo.module';
import { MailingModule } from './mailing/mailing.module';
import { LoggingModule } from './logging/logging.module';

@Module({
  imports: [
    JwtModule.register({ global: true, secret: process.env.JWT_SECRET }),
    UsersModule,
    SetupModule,
    AuthModule,
    RangeModule,
    CryptoModule,
    VideoModule,
    FileModule,
    PaymentModule,
    StatisticsModule,
    PhotoModule,
    MailingModule,
    LoggingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
