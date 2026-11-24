import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RoleName } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { MSG_PASSWORD_EQUALS_EMAIL } from './dto/account-rules';
import { UpdateUserDto } from './dto/update-user.dto';

export const MSG_SELF_ACTION =
  'Tidak bisa menonaktifkan, menghapus, atau mengubah peran akun sendiri.';
export const MSG_LAST_SUPER_ADMIN = 'Harus ada minimal satu Super Admin aktif.';
export const MSG_EMAIL_TAKEN = 'Email sudah dipakai akun lain.';
export const MSG_HAS_HISTORY =
  'Akun ini sudah punya riwayat aktivitas, jadi tidak bisa dihapus. Nonaktifkan saja.';

const BCRYPT_ROUNDS = 10;

const ROLE_ORDER: Record<RoleName, number> = {
  SUPER_ADMIN: 0,
  OWNER: 1,
  ADMIN_PENGINAPAN: 2,
};

export interface UserListItem {
  id: number;
  name: string;
  email: string;
  role: RoleName;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  role: { name: RoleName };
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { name: true } },
} as const;

function toItem(u: UserRow): UserListItem {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role.name,
    isActive: u.isActive,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: string }).code === 'P2002'
  );
}

/** Kelola akun (Super Admin). Password tidak pernah dikembalikan ke klien. */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<UserListItem[]> {
    const rows = await this.prisma.user.findMany({
      select: userSelect,
      orderBy: { name: 'asc' },
    });
    return rows
      .map(toItem)
      .sort(
        (a, b) =>
          ROLE_ORDER[a.role] - ROLE_ORDER[b.role] ||
          a.name.localeCompare(b.name, 'id'),
      );
  }

  async create(dto: CreateUserDto): Promise<UserListItem> {
    const email = dto.email.trim().toLowerCase();
    if (dto.password.trim().toLowerCase() === email) {
      throw new BadRequestException(MSG_PASSWORD_EQUALS_EMAIL);
    }
    await this.assertEmailFree(email);
    const role = await this.findRole(dto.role);
    const password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    try {
      const row = await this.prisma.user.create({
        data: { name: dto.name.trim(), email, password, roleId: role.id },
        select: userSelect,
      });
      return toItem(row);
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictException(MSG_EMAIL_TAKEN);
      throw err;
    }
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    actorId: number,
  ): Promise<UserListItem> {
    const target = await this.findOrFail(id);
    const roleChanges = dto.role !== undefined && dto.role !== target.role.name;
    const deactivates = dto.isActive === false && target.isActive;

    if (id === actorId && (roleChanges || dto.isActive === false)) {
      throw new BadRequestException(MSG_SELF_ACTION);
    }

    const losesSuperAdmin =
      target.role.name === RoleName.SUPER_ADMIN &&
      target.isActive &&
      (roleChanges || deactivates);
    if (losesSuperAdmin) await this.assertOtherActiveSuperAdmin(id);

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      if (email !== target.email) await this.assertEmailFree(email, id);
      data.email = email;
    }
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (roleChanges && dto.role)
      data.roleId = (await this.findRole(dto.role)).id;

    try {
      const row = await this.prisma.user.update({
        where: { id },
        data,
        select: userSelect,
      });
      return toItem(row);
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictException(MSG_EMAIL_TAKEN);
      throw err;
    }
  }

  async resetPassword(id: number, password: string): Promise<{ ok: true }> {
    const target = await this.findOrFail(id);
    if (password.trim().toLowerCase() === target.email.toLowerCase()) {
      throw new BadRequestException(MSG_PASSWORD_EQUALS_EMAIL);
    }
    await this.prisma.user.update({
      where: { id },
      data: { password: await bcrypt.hash(password, BCRYPT_ROUNDS) },
    });
    return { ok: true };
  }

  async remove(id: number, actorId: number): Promise<{ ok: true }> {
    const target = await this.findOrFail(id);

    if (id === actorId) throw new BadRequestException(MSG_SELF_ACTION);

    if (target.role.name === RoleName.SUPER_ADMIN && target.isActive) {
      await this.assertOtherActiveSuperAdmin(id);
    }

    const counts = await this.prisma.user.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            createdReservations: true,
            recordedPayments: true,
            editedReservations: true,
            createdRoomTypes: true,
            updatedSiteSections: true,
            updatedContentItems: true,
          },
        },
      },
    });
    const used = Object.values(counts?._count ?? {}).some((n) => n > 0);
    if (used) throw new ConflictException(MSG_HAS_HISTORY);

    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }

  private async findOrFail(id: number): Promise<UserRow> {
    const row = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!row) throw new NotFoundException('Akun tidak ditemukan.');
    return row;
  }

  private async findRole(name: RoleName) {
    const role = await this.prisma.role.findUnique({ where: { name } });
    if (!role) throw new BadRequestException('Peran tidak dikenali.');
    return role;
  }

  private async assertEmailFree(email: string, exceptId?: number) {
    const clash = await this.prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        ...(exceptId !== undefined ? { id: { not: exceptId } } : {}),
      },
      select: { id: true },
    });
    if (clash) throw new ConflictException(MSG_EMAIL_TAKEN);
  }

  private async assertOtherActiveSuperAdmin(excludeId: number) {
    const others = await this.prisma.user.count({
      where: {
        id: { not: excludeId },
        isActive: true,
        role: { name: RoleName.SUPER_ADMIN },
      },
    });
    if (others < 1) throw new BadRequestException(MSG_LAST_SUPER_ADMIN);
  }
}
