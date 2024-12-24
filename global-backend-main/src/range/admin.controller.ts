import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { RangeService } from './range.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { GlobalAdminGuard } from 'src/auth/guards/global-admin.guard';
import { RangeCommunicator } from './range-communicator';
import { CreateRangeDto } from './dto/create-range.dto';
import { RangeErrors } from './constants';
import { UpdateRangeDto } from './dto/update-range.dto';
import { PaginateDto } from 'src/helpers/paginate/types';
import { MaxTake } from 'src/helpers/paginate/max-take.decorator';
import { User } from 'src/users/user.decorator';
import { UserContext } from 'src/auth/types';
import { PrismaService } from '../helpers/prisma.service';

@Controller('range/admin')
export class RangeAdminController {
  constructor(
    private prisma: PrismaService,
    private readonly rangeService: RangeService,
  ) {}

  /**
   * Global admin uses this api endpoint to create new range.
   * It also checks is range is available, exchanges keys with range and sets up
   * owners of that created range.
   *
   * Flow is:
   * create_user(): user_id -> create_range(user_id): range_id
   *
   * @param payload create range payload
   * @returns created range
   */
  @UseGuards(AuthGuard, GlobalAdminGuard)
  @Post('create_range')
  async createRange(@Body() payload: CreateRangeDto) {
    const isRangeAvailable = await RangeCommunicator.ping(payload.ip_address);
    console.log(isRangeAvailable);
    if (!isRangeAvailable)
      throw new ServiceUnavailableException(RangeErrors.RangeUnavailable);

    const createdRange = await this.rangeService.complexCreateRange(payload);
    const communicator = this.rangeService.getRangeCommunicator(createdRange);

    const setupResponse = await this.rangeService.setupRange(
      createdRange,
      communicator,
    );
    if ('error' in setupResponse.data) {
      // range did not accept our setup request, rollback
      await this.prisma.range.delete({ where: { id: createdRange.id } });
      throw new InternalServerErrorException(
        RangeErrors.RangeCreationError,
        setupResponse.data.message as string,
      );
    }

    return createdRange;
  }

  /**
   * Finds all existing ranges
   */
  @MaxTake(100)
  @UseGuards(AuthGuard)
  @Get('all')
  async findAll(@User() user: UserContext, @Query() pagination: PaginateDto) {
    const [count, items] = await this.rangeService.findRanges(
      this.rangeService.buildFilter(user),
      pagination,
    );
    const filteredItems = items.map((range) =>
      this.rangeService.filterFields(range),
    );

    return { count, items: filteredItems };
  }

  /**
   * Finds one specific range with security guards and owners
   */
  @UseGuards(AuthGuard)
  @Get(':id')
  async findRange(@User() user: UserContext, @Param('id') rangeId: number) {
    const range = await this.rangeService.findOne({
      where: {
        id: rangeId,
        ...this.rangeService.buildFilter(user),
      },
      include: {
        owners: { select: { id: true, email: true, username: true } },
        security_guards: { select: { id: true, email: true, username: true } },
      },
    });
    if (!range) throw new NotFoundException(RangeErrors.RangeNotFound);

    return this.rangeService.filterFields(range);
  }

  /**
   * Updates one specific range. Can connect and disconnect owners
   * and security guars, as well as update name and other range fields.
   */
  @UseGuards(AuthGuard)
  @Patch(':id')
  async updateRange(
    @User() user: UserContext,
    @Param('id') rangeId: number,
    @Body() payload: UpdateRangeDto,
  ) {
    const range = await this.rangeService.findOne({
      where: {
        id: rangeId,
        ...this.rangeService.buildFilter(user),
      },
    });
    if (!range) throw new NotFoundException(RangeErrors.RangeNotFound);

    return this.rangeService
      .updateRange(user, rangeId, payload)
      .then(this.rangeService.filterFields);
  }

  /**
   * This endpoint is used by global admin to completely disable and remove
   * the specified range
   */
  @UseGuards(AuthGuard, GlobalAdminGuard)
  @Delete(':id')
  removeRange(@User() user: UserContext, @Param('id') rangeId: number) {
    return this.rangeService.removeRange(user, rangeId);
  }
}
