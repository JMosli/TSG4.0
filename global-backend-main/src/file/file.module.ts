import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { PrismaService } from 'src/helpers/prisma.service';
import { LocalFileService } from './local-file.service';
import { FileAdminController } from './admin.controller';

@Module({
  controllers: [FileController, FileAdminController],
  providers: [FileService, LocalFileService, PrismaService],
  exports: [FileService, LocalFileService],
})
export class FileModule {}
