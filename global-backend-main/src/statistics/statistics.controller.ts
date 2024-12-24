import {
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RangeGuard } from 'src/range/signature-manager/range-request.guard';
import { SignerInterceptor } from 'src/range/signature-manager/response-signer.interceptor';
import { Range } from 'src/range/range.decorator';
import { RangeContext } from 'src/range/constants';
import { DateQueryDto, StatisticsQueryDto } from './dto/statistics-query.dto';
import { User } from 'src/users/user.decorator';
import { UserContext } from 'src/auth/types';
import { GlobalAdminGuard } from 'src/auth/guards/global-admin.guard';
import { PaginateDto } from 'src/helpers/paginate/types';
import { MaxTake } from 'src/helpers/paginate/max-take.decorator';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  /**
   * Gets top 10 payments by price and avg price
   * @return list of payments
   */
  @Get('payment/price')
  @UseGuards(AuthGuard)
  async paymentPrice(@User() user: UserContext, @Query() query: DateQueryDto) {
    if (!query.range_id && !user.is_global_admin)
      throw new ForbiddenException();
    return this.statisticsService.paymentPrice(
      query.range_id,
      query.start_date && query.end_date
        ? [query.start_date, query.end_date]
        : undefined,
    );
  }

  /**
   * Gets all payments by statuses
   * @return 2 numbers, amount of completed payments and payments in process (created)
   */
  @Get('payment/status')
  @UseGuards(AuthGuard)
  async paymentStatus(
    @User() user: UserContext,
    @Query() query: StatisticsQueryDto,
  ) {
    if (!query.range_id && !user.is_global_admin)
      throw new ForbiddenException();
    return this.statisticsService.paymentStatus(query.range_id);
  }

  /**
   * Get number of users visited payment page (just visited)
   * @return number of visited users
   */
  @Get('payment/visitors')
  @UseGuards(AuthGuard)
  async paymentVisitors(
    @User() user: UserContext,
    @Query() query: StatisticsQueryDto,
  ) {
    if (!query.range_id && !user.is_global_admin)
      throw new ForbiddenException();
    return this.statisticsService.visitors(query.range_id);
  }

  /**
   * Returns total price for each range
   */
  @Get('payment/price_by_range')
  @UseGuards(AuthGuard, GlobalAdminGuard)
  @MaxTake(20)
  priceByRange(@Query() pagination: PaginateDto) {
    return this.statisticsService.totalPriceByRange(pagination);
  }

  /**
   * Returns a full poll statistics
   */
  @Get('poll')
  @UseGuards(AuthGuard, GlobalAdminGuard)
  poll(@User() user: UserContext, @Query() query: StatisticsQueryDto) {
    if (!query.range_id && !user.is_global_admin)
      throw new ForbiddenException();
    return this.statisticsService.poll(query.range_id);
  }
}
