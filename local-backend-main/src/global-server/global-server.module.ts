import { Global, Module } from '@nestjs/common';
import { GlobalServerService } from './global-server.service';
import { RangeService } from 'src/range/range.service';
import { PrismaService } from 'src/helpers/prisma.service';
import { RangeModule } from '../range/range.module';

@Global()
@Module({
  providers: [GlobalServerService, PrismaService],
  exports: [GlobalServerService],
  imports: [RangeModule],
})
export class GlobalServerModule {}
