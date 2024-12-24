import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { GlobalServerService } from 'src/global-server/global-server.service';
import { AddPollAnswerDto } from './dto/add-poll-answer.dto';
import { KioskRequestGuard } from './kiosk.guard';

@Controller('kiosk/logging')
  @UseGuards(KioskRequestGuard)
export class KioskLoggingController {
  constructor(private readonly globalServer: GlobalServerService) {}

  /**
   * Logs a new poll answer
   */
  @Post('add_poll_answer')
  addPollAnswer(@Body() payload: AddPollAnswerDto) {
    return this.globalServer.communicator.logging
      .addPollAnswer(payload.client_id, payload.question, payload.answer)
      .then((r) => r.ok());
  }

  /**
   * Logs a new visit
   */
  @Post('add_visit')
  addVisit() {
    return this.globalServer.communicator.logging
      .addVisit()
      .then((r) => r.ok());
  }
}
