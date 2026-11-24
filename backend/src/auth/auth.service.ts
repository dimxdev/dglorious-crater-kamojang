import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { MSG_PASSWORD_EQUALS_EMAIL } from '../users/dto/account-rules';
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

    // Dicek setelah password cocok supaya status akun tidak bisa diintip
    // oleh orang yang tidak tahu kata sandinya.
    if (!user.isActive) {
      throw new UnauthorizedException(
        'Akun dinonaktifkan. Hubungi Super Admin.',
      );
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

  /** Ganti kata sandi sendiri (semua role). */
  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
  ): Promise<{ ok: true }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Akun tidak ditemukan.');

    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new BadRequestException('Kata sandi saat ini salah.');
    }
    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException(
        'Kata sandi baru harus berbeda dari yang sekarang.',
      );
    }

    if (dto.newPassword.trim().toLowerCase() === user.email.toLowerCase()) {
      throw new BadRequestException(MSG_PASSWORD_EQUALS_EMAIL);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: await bcrypt.hash(dto.newPassword, 10) },
    });
    return { ok: true };
  }
}
