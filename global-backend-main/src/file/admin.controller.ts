import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LocalFileService } from './local-file.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { GlobalAdminGuard } from 'src/auth/guards/global-admin.guard';
import { MaxTake } from 'src/helpers/paginate/max-take.decorator';
import { PaginateDto } from 'src/helpers/paginate/types';

@Controller('/file/admin')
export class FileAdminController {
  constructor(private readonly fileService: LocalFileService) {}

  /**
   * Finds all files in the database
   */
  @MaxTake(100)
  @UseGuards(AuthGuard, GlobalAdminGuard)
  @Get('all')
  async findFiles(@Query() pagination: PaginateDto) {
    const [count, items] = await this.fileService.findFiles({}, pagination);

    return { count, items };
  }
}
