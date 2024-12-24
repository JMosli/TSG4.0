import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginateDto } from 'src/helpers/paginate/types';
import { PrismaService } from 'src/helpers/prisma.service';
import { KioskService } from 'src/kiosk/kiosk.service';
import { RangeService } from 'src/range/range.service';
import { PaymentErrors } from './constants';

@Injectable()
export class PaymentTerminalService {
  constructor(
    private prisma: PrismaService,
    private readonly rangeService: RangeService,
    private readonly kioskService: KioskService,
  ) {}

  /**
   * Finds one payment terminal in the database on the
   * default range
   * @param where where clause
   * @returns found terminal
   * @throws {NotFoundException} if terminal was not found
   */
  async findOne(where: Prisma.PaymentTerminalWhereInput) {
    const range = await this.rangeService.getDefault();
    const terminal = await this.prisma.paymentTerminal.findFirst({
      where: { range: { id: range.id }, ...where },
    });
    if (!terminal)
      throw new NotFoundException(PaymentErrors.PaymentTerminalNotFound);

    return terminal;
  }

  /**
   * Finds multiple cameras in the database with pagination
   * on the default range
   * @param where where clause
   * @param pagination pagination parameters
   * @returns a list of payment terminals
   */
  async paginate(
    where: Prisma.PaymentTerminalWhereInput,
    pagination: PaginateDto,
  ) {
    const range = await this.rangeService.getDefault();
    const rangeWhere = { range: { id: range.id }, ...where };

    const [count, items] = await this.prisma.$transaction([
      this.prisma.paymentTerminal.count({ where: rangeWhere }),
      this.prisma.paymentTerminal.findMany({
        where: rangeWhere,
        ...pagination,
      }),
    ]);

    return { count, items };
  }

  /**
   * Creates new payment terminal in the database
   * on the default range.
   * @returns new payment terminal
   */
  async createPaymentTerminal(kioskId: number, readerId: string) {
    const range = await this.rangeService.getDefault();
    const kiosk = await this.kioskService.findOne({ id: kioskId });

    return this.prisma.paymentTerminal.create({
      data: {
        is_connected: true,
        reader_id: readerId,
        kiosk: {
          connect: {
            id: kiosk.id,
          },
        },
        range: {
          connect: {
            id: range.id,
          },
        },
      },
    });
  }

  /**
   * Removes a terminal
   */
  async remove(terminalId: number) {
    return this.prisma.paymentTerminal.delete({ where: { id: terminalId } });
  }
}
