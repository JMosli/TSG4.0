import { Module } from '@nestjs/common';
import { MailingService } from './mailing.service';
import { MailingController } from './mailing.controller';
import { PrismaService } from 'src/helpers/prisma.service';
import { RangeModule } from 'src/range/range.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [MailingController],
  providers: [MailingService, PrismaService],
  exports: [MailingService],
  imports: [UsersModule],
})
export class MailingModule {}
