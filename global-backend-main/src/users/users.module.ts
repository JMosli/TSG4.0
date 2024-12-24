import { Global, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from 'src/helpers/prisma.service';
import { UsersAdminController } from './admin.controller';

@Global()
@Module({
  controllers: [UsersController, UsersAdminController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
