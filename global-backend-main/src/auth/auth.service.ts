import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/helpers/prisma.service';
import { AuthErrors } from './types';
import { SignInDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import { CryptoService } from 'src/crypto/crypto.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly cryptoService: CryptoService,
  ) {}

  /**
   * Checks and generates jwt token for the specified user.
   * @param signIn sign in parameters
   * @returns access token
   * @throws {NotFoundException} if user was not found or password is wrong
   */
  async signIn(signIn: SignInDto) {
    // You can login by sign in or by username
    // These two fields are unique, so user can use either username or email
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: signIn.username }, { username: signIn.username }],
      },
    });
    if (!user) throw new NotFoundException(AuthErrors.NotFound);

    const passwordMatches = await this.cryptoService.verify(
      signIn.password,
      user.password,
    );
    if (!passwordMatches) throw new NotFoundException(AuthErrors.NotFound);

    const accessToken = await this.jwtService.signAsync(
      { user: user.id },
      { expiresIn: '30d' },
    );

    return { accessToken };
  }
}
