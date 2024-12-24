import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/helpers/prisma.service';
import { CreateUserDto } from './dto/create-user';
import { CryptoService } from 'src/crypto/crypto.service';
import { PaginateDto } from 'src/helpers/paginate/types';
import { UserErrors } from './constants';
import { UserContext } from 'src/auth/types';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  /**
   * Finds one specific user in the database by user id
   * @param userId user id to find in the database
   * @returns found user or null
   */
  findOne(
    where: Prisma.UserWhereInput,
    options: Partial<Prisma.UserFindUniqueArgs> = {},
  ) {
    return this.prisma.user.findFirst({ where, ...options });
  }

  /**
   * Finds all users with matching fields in the database.
   * @param where where clause
   * @param pagination pagination parameters
   * @returns found users
   */
  find(where: Prisma.UserWhereInput, pagination?: PaginateDto) {
    return this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        ...pagination,
      }),
    ]);
  }

  /**
   * Creates user in the database encrypting the provided password
   * @returns created use
   */
  async createUser(
    user: CreateUserDto & { is_global_admin: boolean; created_by?: number },
  ) {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: user.email }, { username: user.username }] },
    });
    if (existingUser) throw new ConflictException(UserErrors.UserExists);

    const encryptedPassword = await this.cryptoService.hash(user.password);

    return this.prisma.user.create({
      data: {
        ...user,
        password: encryptedPassword,
        created_by: {
          connect: {
            id: user.created_by,
          },
        },
      },
    });
  }

  /**
   * Removes user from the database.
   * @param userId id of the user to remove
   * @returns removed use
   * @throws {NotFoundException} if user was not found
   */
  async deleteUser(actedUser: UserContext, userId: number) {
    const user = await this.findOne({
      id: userId,
      created_by_userId: actedUser.is_global_admin ? undefined : actedUser.id,
    });
    if (!user) throw new NotFoundException(UserErrors.UserNotFound);

    return this.prisma.user.delete({ where: user });
  }
}
