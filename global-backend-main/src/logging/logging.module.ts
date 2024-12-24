import { Module } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { LoggingController } from './logging.controller';
import { PrismaService } from 'src/helpers/prisma.service';

@Module({
  controllers: [LoggingController],
  providers: [LoggingService, PrismaService],
  exports: [LoggingService],
})
export class LoggingModule {}
