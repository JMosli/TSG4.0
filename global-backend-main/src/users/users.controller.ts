import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { User } from './user.decorator';
import { UserContext } from 'src/auth/types';
import { GlobalAdminGuard } from 'src/auth/guards/global-admin.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  getMe(@User() user: UserContext) {
    return user;
  }
}
