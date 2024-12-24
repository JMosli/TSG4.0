import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GlobalRequestGuard } from 'src/global-server/signature-manager/global-server.guard';
import { SignerInterceptor } from 'src/global-server/signature-manager/response-signer.interceptor';
import { UserGuard } from 'src/global-server/user-manager/user-request.guard';
import { MaxTake } from 'src/helpers/paginate/max-take.decorator';
import { PaginateDto } from 'src/helpers/paginate/types';
import { CreateTerminalDto } from './dto/create-terminal.dto';
import { PaymentTerminalService } from './terminal.service';

@UseInterceptors(SignerInterceptor)
@UseGuards(GlobalRequestGuard, UserGuard)
@Controller('payment/terminal')
export class PaymentTerminalController {
  constructor(private readonly terminalService: PaymentTerminalService) {}

  /**
   * Gets all payment terminals in the database
   */
  @Get('all')
  @MaxTake(20)
  getAllTerminals(@Query() pagination: PaginateDto) {
    return this.terminalService.paginate({}, pagination);
  }

  /**
   * Gets one terminal from the database by id
   */
  @Get(':id')
  getTerminal(@Param('id') terminalId: number) {
    return this.terminalService.findOne({ id: terminalId });
  }

  /**
   * Creates a payment terminal in the database
   */
  @Post('create_payment_terminal')
  createPaymentTerminal(@Body() body: CreateTerminalDto) {
    return this.terminalService.createPaymentTerminal(
      body.kiosk_id,
      body.reader_id,
    );
  }

  /**
   * Removes a terminal
   */
  @Delete(':id')
  removeTerminal(@Param('id') terminalId: number) {
    return this.terminalService.remove(terminalId);
  }
}
