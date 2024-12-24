import {
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LoggingService } from './logging.service';
import { RangeGuard } from 'src/range/signature-manager/range-request.guard';
import { SignerInterceptor } from 'src/range/signature-manager/response-signer.interceptor';
import { AddPollAnswerDto } from './dto/add-poll-answer.dto';
import { Range } from 'src/range/range.decorator';
import { RangeContext } from 'src/range/constants';

@Controller('logging')
@UseInterceptors(SignerInterceptor)
@UseGuards(RangeGuard)
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  @Post('poll/add_answer')
  async addPollAnswer(
    @Body() payload: AddPollAnswerDto,
    @Range() range: RangeContext,
  ) {
    return this.loggingService.addPollAnswer(range.id, payload);
  }

  /**
   * Update number of users visited payment page (just visited)
   * @return updated number of visited users
   */
  @Post('visit')
  async updatePaymentVisitorCounter(@Range() range: RangeContext) {
    return this.loggingService.addVisit(range);
  }
}
