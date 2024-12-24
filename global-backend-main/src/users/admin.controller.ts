import {
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { GlobalAdminGuard } from 'src/auth/guards/global-admin.guard';
import { CreateUserDto } from './dto/create-user';
import { MaxTake } from 'src/helpers/paginate/max-take.decorator';
import { GetUsersDto } from './dto/get-users.dto';
import { User } from './user.decorator';
import { UserContext } from 'src/auth/types';
import { UserErrors } from './constants';

@Controller('users/admin')
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * This endpoint is used by the global admin to create users
   * and then assign them to the ranges needed.
   *
   * So, the flow is the following:
   * create_user: user_id -> create_range(user_id): range_id
   * @param payload data to create user
   */
  @UseGuards(AuthGuard)
  @Post('create_user')
  createUser(@User() user: UserContext, @Body() payload: CreateUserDto) {
    if (!user.is_global_admin && payload.is_global_admin)
      throw new ForbiddenException(UserErrors.FailedToCreateUser);
    return this.usersService.createUser({
      ...payload,
      created_by: user.id,
    });
  }

  /**
   * Removes user from the database.
   * Does not remove anything else related to the specified user.
   *
   * @throws {ForbiddenException} if user tries to remove himself
   */
  @UseGuards(AuthGuard)
  @Delete(':id')
  deleteUser(@User() user: UserContext, @Param('id') userId: number) {
    if (user.id === userId)
      throw new ForbiddenException(UserErrors.ItselfDelete);

    return this.usersService.deleteUser(user, userId);
  }

  /**
   * This endpoint is used by the global admin to find all users registered in the system.
   * @param pagination pagination and search parameters
   */
  @MaxTake(100)
  @UseGuards(AuthGuard)
  @Get('users')
  async findUsers(@User() user: UserContext, @Query() pagination: GetUsersDto) {
    const [count, items] = await this.usersService.find(
      {
        owner_of: pagination.owner_of
          ? { some: { id: pagination.owner_of } }
          : undefined,
        security_guard_of: pagination.so_of
          ? { some: { id: pagination.so_of } }
          : undefined,
        created_by_userId: user.is_global_admin ? undefined : user.id,
      },
      pagination,
    );
    const filteredItems = items.map((user) => ({
      ...user,
      password: undefined,
    }));

    return { count, items: filteredItems };
  }

  /**
   * Retrieves one user by its id.
   * Note: returns only users that were created by a user.
   * If the request was made by a global admin, it will return in any case
   */
  @Get(':id')
  @UseGuards(AuthGuard)
  async findUser(@User() user: UserContext, @Param('id') id: number) {
    const foundUser = await this.usersService.findOne(
      { id, created_by_userId: user.is_global_admin ? undefined : user.id },
      {
        include: {
          owner_of: { select: { id: true, name: true } },
          security_guard_of: { select: { id: true, name: true } },
          created_users: {
            select: { id: true, username: true, email: true },
          },
        },
      },
    );
    if (!foundUser) throw new NotFoundException(UserErrors.UserNotFound);

    return { ...foundUser, password: undefined };
  }
}
