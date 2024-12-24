import { Controller, Get, UseGuards } from '@nestjs/common';
import { SetupService } from './setup.service';
import { SetupEnabledGuard } from './enabled.guard';

@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @UseGuards(SetupEnabledGuard)
  @Get('all')
  async setupAll() {
    await this.crateDirectories();
    await this.createGlobalAdmin();
  }

  /**
   * Used by the developer to setup a initial global admin account
   * @returns created user
   */
  @UseGuards(SetupEnabledGuard)
  @Get('create_global_admin')
  createGlobalAdmin() {
    return this.setupService.createGlobalAdmin();
  }

  /**
   * Creates all directories needed to store videos and other things
   */
  @UseGuards(SetupEnabledGuard)
  @Get('create_directories')
  crateDirectories() {
    return this.setupService.createDirectories();
  }
}
