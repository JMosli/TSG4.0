import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MailingService } from './mailing.service';
import { RangeGuard } from 'src/range/signature-manager/range-request.guard';
import { SignerInterceptor } from 'src/range/signature-manager/response-signer.interceptor';
import { Range } from 'src/range/range.decorator';
import { RangeContext } from 'src/range/constants';
import { SendMessageDto } from './dto/send-message.dto';
import { UsersService } from 'src/users/users.service';

@Controller('mailing')
@UseInterceptors(SignerInterceptor)
@UseGuards(RangeGuard)
export class MailingController {
  constructor(
    private readonly mailingService: MailingService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Sends a message to all range owners
   */
  @Post('send_owner')
  async sendOwnerMessage(
    @Range() range: RangeContext,
    @Body() payload: SendMessageDto,
  ) {
    const [_, owners] = await this.usersService.find({
      owner_of: { some: { id: range.id } },
    });
    return this.mailingService.createMessage({
      to: owners.map((o) => o.email),
      subject: `Range ${range.name} | ${payload.title}`,
      text: payload.message,
    });
  }
}
