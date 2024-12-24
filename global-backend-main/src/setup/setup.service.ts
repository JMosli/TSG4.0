import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/helpers/prisma.service';
import { CryptoService } from 'src/crypto/crypto.service';
import fs from 'fs/promises';
import { setupSettings } from './constants';

@Injectable()
export class SetupService {
  constructor(
    private prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  /**
   * Creates all needed directories for system to operate
   */
  async createDirectories() {
    await fs.mkdir(setupSettings.SYSTEM_PATH).catch(() => null);
    await fs.mkdir(setupSettings.USERDATA_PATH).catch(() => null);
    await fs.mkdir(setupSettings.TEMP_PATH).catch(() => null);
  }

  /**
   * Creates global admin in the database
   * @returns created global admin
   */
  async createGlobalAdmin() {
    const hashedPassword = await this.cryptoService.hash(
      process.env.ADMIN_PASSWORD,
    );

    return this.prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@admin.com',
        password: hashedPassword,
        is_global_admin: true,
      },
    });
  }
}
