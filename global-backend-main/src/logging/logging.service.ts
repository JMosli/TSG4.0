import { Injectable } from '@nestjs/common';
import { EventType } from '@prisma/client';
import { PrismaService } from 'src/helpers/prisma.service';
import { RangeContext } from 'src/range/constants';
import { AddPollAnswerDto } from './dto/add-poll-answer.dto';

@Injectable()
export class LoggingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registers a new poll answer
   */
  addPollAnswer(rangeId: number, payload: AddPollAnswerDto) {
    return this.prisma.pollAnswer.create({
      data: {
        ...payload,
        range: { connect: { id: rangeId } },
      },
    });
  }

  /**
   * Logs new visit and saves it into the database
   */
  addVisit(range: RangeContext) {
    return this.prisma.event.create({
      data: {
        type: EventType.PAYMENT_PAGE_VISIT,
        range: {
          connect: {
            id: range.id,
          },
        },
      },
    });
  }
}
