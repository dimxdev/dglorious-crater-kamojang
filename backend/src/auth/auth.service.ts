import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AuthUser, JwtPayload } from './types/jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Verifies email + password. Throws 401 on any mismatch (same error for
   * unknown email and wrong password, so it can't be used to probe accounts).
   */
  async login(dto: LoginDto): Promise<{ accessToken: string; user: AuthUser }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    const passwordOk =
      user && (await bcrypt.compare(dto.password, user.password));

    if (!user || !passwordOk) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    };

    return {
      accessToken: await this.jwt.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
      },
    };
  }
}
