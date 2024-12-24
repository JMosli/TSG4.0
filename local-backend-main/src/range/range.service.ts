import { Injectable, NotFoundException } from '@nestjs/common';
import type { Range } from '@prisma/client';
import { PrismaService } from 'src/helpers/prisma.service';
import { RangeErrors } from './constants';
import { CreateRangeDto } from './dto/create-range.dto';

@Injectable()
export class RangeService {
  private _cachedDefaultRange: Range | null;

  constructor(private prisma: PrismaService) {}

  /**
   * Returns one default range
   * @returns default range to work with
   */
  async getDefault() {
    if (this._cachedDefaultRange) return this._cachedDefaultRange;

    const range = await this.prisma.range.findFirst({
      where: { is_default: true },
    });
    if (!range) throw new NotFoundException(RangeErrors.DefaultRangeNotFound);

    return (this._cachedDefaultRange = range);
  }

  /**
   * Creates new range entry in the database
   * @param payload options to create range
   * @param isDefault will a created range be default
   * @returns new range
   */
  createRange(payload: CreateRangeDto, isDefault: boolean) {
    return this.prisma.range.create({
      data: {
        private_key_signer: payload.private_key_signer,
        public_key_checker: payload.public_key_checker,
        global_id: payload.range_id,
        camera_subnet: process.env.CAMERA_SUBNET,
        is_default: isDefault,
      },
    });
  }

  /**
   * Removes range from the database (and all related data).
   * @param range range to remove
   * @returns removed range
   */
  removeRange(range: Range) {
    return this.prisma.range.delete({
      where: { id: range.id },
    });
  }
}
