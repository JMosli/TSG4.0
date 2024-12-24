import { Module } from '@nestjs/common';
import { SetupService } from './setup.service';
import { SetupController } from './setup.controller';
import { PrismaService } from 'src/helpers/prisma.service';

@Module({
  providers: [SetupService, PrismaService],
  controllers: [SetupController],
})
export class SetupModule {}
