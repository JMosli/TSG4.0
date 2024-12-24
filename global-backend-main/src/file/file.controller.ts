import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { LocalFileService } from './local-file.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { AllowUnauthorized } from 'src/helpers/allow-unauthorized.decorator';
import { User } from 'src/users/user.decorator';
import { UserContext } from 'src/auth/types';
import { FileErrors } from './constants';

@Controller('file')
export class FileController {
  constructor(private fileService: LocalFileService) {}

  @UseGuards(AuthGuard)
  @AllowUnauthorized()
  @Get(':id/content')
  async getFileContent(@User() user: UserContext, @Param('id') fileId: number) {
    const file = await this.fileService.findFile(fileId);
    if (!file) throw new NotFoundException(FileErrors.FileNotFound);

    // getting file contents and deleting file if its not found in filesystem
    try {
      const contents = await this.fileService.getFileContents(file);
      return { content: contents.toString('base64') };
    } catch (error) {
      if (error instanceof NotFoundException) {
        // not present in filesystem
        this.fileService.deleteFile(file.id);
      }
      throw error;
    }
  }
}
