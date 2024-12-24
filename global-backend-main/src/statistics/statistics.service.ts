import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../helpers/prisma.service';
import { EventType, Prisma } from '@prisma/client';
import { RangeContext, RangeErrors } from 'src/range/constants';
import { RangeService } from 'src/range/range.service';
import { PaginateDto } from 'src/helpers/paginate/types';

@Injectable()
export class StatisticsService {
  constructor(
    private prisma: PrismaService,
    private readonly rangeService: RangeService,
  ) {}

  /**
   * Returns all payment statistic about price:
   * 1. total price
   * 2. average price
   * 3. price by date
   *
   * The range id is optional, if it is not specified, all
   * ranges will be included in the statistic measurements
   */
  async paymentPrice(rangeId?: number, dateRange?: [number, number]) {
    const range = await this.rangeService.findOne({ where: { id: rangeId } });
    if (!range && rangeId)
      throw new NotFoundException(RangeErrors.RangeNotFound);

    const startDate = dateRange && new Date(dateRange[0] * 1000);
    const endDate = dateRange && new Date(dateRange[1] * 1000);

    const totals = await this.prisma.payment.aggregate({
      where: {
        rangeId,
        createdAt: dateRange
          ? {
              gt: startDate,
              lt: endDate,
            }
          : undefined,
      },
      _avg: {
        price: true,
      },
      _sum: {
        price: true,
      },
    });
    const priceByDay = await this.prisma.$queryRaw`
      SELECT DATE("createdAt") as "date", CAST(SUM("price") as INT) as "total_price"
      FROM "Payment"
      WHERE "active" = false 
      ${rangeId ? Prisma.sql`AND "rangeId" = ${rangeId}` : Prisma.empty}
      ${
        dateRange
          ? Prisma.sql`AND 
        extract(epoch from "createdAt")
        BETWEEN 
          ${Math.round(startDate.getTime() / 1000)} AND
          ${Math.round(endDate.getTime() / 1000)}
      `
          : Prisma.empty
      }
      GROUP BY DATE("createdAt")
      ORDER BY "date";
    `;

    return {
      totals,
      price_by_day: priceByDay,
    };
  }

  /**
   * Returns all payment statistic about statuses:
   * 1. Total number of active payment sessions
   * 2. Total number of inactive payment sessions
   * 3. Number of active and inactive payment sessions by date
   *
   * The range id is optional as for paymentPrice
   */
  async paymentStatus(rangeId?: number) {
    const active = await this.prisma.payment.count({
      where: { active: true, rangeId },
    });
    const inactive = await this.prisma.payment.count({
      where: { active: false, rangeId },
    });

    const statusesByDay = await this.prisma.$queryRaw`
       SELECT 
        DATE("createdAt") as "date",
        CAST(SUM(CASE WHEN "active" = true THEN 1 ELSE 0 END) as INT) as "active_count",
        CAST(SUM(CASE WHEN "active" = false THEN 1 ELSE 0 END) as INT) as "inactive_count"
      FROM "Payment"
      ${rangeId ? Prisma.sql`WHERE "rangeId" = ${rangeId}` : Prisma.empty}  
      GROUP BY DATE("createdAt")
      ORDER BY "date";
    `;

    return {
      totals: {
        active,
        inactive,
      },
      status_by_day: statusesByDay,
    };
  }

  /**
   * Returns statistics about visitors:
   * 1. How many visitors came in total
   *
   * The range id is optional
   */
  async visitors(rangeId?: number) {
    const visitors = await this.prisma.event.count({
      where: {
        type: EventType.PAYMENT_PAGE_VISIT,
        rangeId,
      },
    });

    return { visitors };
  }

  /**
   * Returns total price for each range
   */
  async totalPriceByRange(pagination: PaginateDto) {
    const items = await this.prisma.$queryRaw`
      SELECT r.id, r.name, r.ip_address, CAST(SUM(p.price) as INT) as total_price
      FROM "Range" r
      JOIN "Payment" p ON r.id = p."rangeId"
      GROUP BY r.id
      ORDER BY total_price DESC
      LIMIT ${pagination.take} OFFSET ${pagination.skip};
    `;
    const count = await this.prisma.range.count();

    return { items, count };
  }

  /**
   * Returns a poll statistics
   */
  async poll(rangeId?: number) {
    const grouped = await this.prisma.$queryRaw`
      SELECT 
        question, 
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'count', answer_count,
            'answer', answer
          )
        ) as answers
      FROM (
        SELECT question, answer, CAST(COUNT(*) as INT) as answer_count
        FROM "PollAnswer"
      ${rangeId ? Prisma.sql`WHERE "rangeId" = ${rangeId}` : Prisma.empty}  
        GROUP BY question, answer
        ORDER BY question, answer
      ) subquery
      GROUP BY question 
      ORDER BY question;
    `;
    const count = await this.prisma.pollAnswer.count({ where: { rangeId } });

    return { count, grouped };
  }
}
