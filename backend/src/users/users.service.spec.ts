import { BadRequestException, ConflictException } from '@nestjs/common';
import { RoleName } from '../generated/prisma/enums';
// Client Prisma hasil generate memakai impor .js yang tidak bisa dimuat ts-jest.
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import {
  MSG_EMAIL_TAKEN,
  MSG_HAS_HISTORY,
  MSG_LAST_SUPER_ADMIN,
  MSG_SELF_ACTION,
  UsersService,
} from './users.service';

type Row = {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  role: { name: RoleName };
};

const row = (id: number, role: RoleName, isActive = true): Row => ({
  id,
  name: `User ${id}`,
  email: `u${id}@x.id`,
  isActive,
  createdAt: new Date(),
  updatedAt: new Date(),
  role: { name: role },
});

function setup(target: Row, otherActiveSuperAdmins = 1, historyCount = 0) {
  const prisma = {
    user: {
      findUnique: jest.fn((args: { select: Record<string, unknown> }) =>
        Promise.resolve(
          '_count' in args.select
            ? { _count: { createdReservations: historyCount } }
            : target,
        ),
      ),
      findFirst: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(otherActiveSuperAdmins),
      update: jest.fn().mockResolvedValue(target),
      delete: jest.fn().mockResolvedValue(target),
      create: jest.fn().mockResolvedValue(target),
    },
    role: { findUnique: jest.fn().mockResolvedValue({ id: 9 }) },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = new UsersService(prisma as any);
  return { service, prisma };
}

describe('UsersService safety rules', () => {
  it('menolak menonaktifkan akun sendiri', async () => {
    const { service, prisma } = setup(row(1, RoleName.SUPER_ADMIN));
    await expect(service.update(1, { isActive: false }, 1)).rejects.toThrow(
      new BadRequestException(MSG_SELF_ACTION),
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('menolak mengubah peran akun sendiri', async () => {
    const { service } = setup(row(1, RoleName.SUPER_ADMIN));
    await expect(
      service.update(1, { role: RoleName.OWNER }, 1),
    ).rejects.toThrow(MSG_SELF_ACTION);
  });

  it('mengizinkan ubah nama akun sendiri dan kirim ulang peran yang sama', async () => {
    const { service, prisma } = setup(row(1, RoleName.SUPER_ADMIN));
    await service.update(1, { name: 'Baru', role: RoleName.SUPER_ADMIN }, 1);
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('menolak menghapus akun sendiri', async () => {
    const { service, prisma } = setup(row(1, RoleName.SUPER_ADMIN));
    await expect(service.remove(1, 1)).rejects.toThrow(MSG_SELF_ACTION);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('menolak menonaktifkan Super Admin aktif terakhir', async () => {
    const { service } = setup(row(2, RoleName.SUPER_ADMIN), 0);
    await expect(service.update(2, { isActive: false }, 1)).rejects.toThrow(
      MSG_LAST_SUPER_ADMIN,
    );
  });

  it('menolak menurunkan peran Super Admin aktif terakhir', async () => {
    const { service } = setup(row(2, RoleName.SUPER_ADMIN), 0);
    await expect(
      service.update(2, { role: RoleName.OWNER }, 1),
    ).rejects.toThrow(MSG_LAST_SUPER_ADMIN);
  });

  it('menolak menghapus Super Admin aktif terakhir', async () => {
    const { service } = setup(row(2, RoleName.SUPER_ADMIN), 0);
    await expect(service.remove(2, 1)).rejects.toThrow(MSG_LAST_SUPER_ADMIN);
  });

  it('mengizinkan menonaktifkan Super Admin lain bila masih ada yang aktif', async () => {
    const { service, prisma } = setup(row(2, RoleName.SUPER_ADMIN), 1);
    await service.update(2, { isActive: false }, 1);
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('tidak menghitung ulang Super Admin saat menonaktifkan akun non Super Admin', async () => {
    const { service, prisma } = setup(row(3, RoleName.OWNER), 0);
    await service.update(3, { isActive: false }, 1);
    expect(prisma.user.count).not.toHaveBeenCalled();
  });

  it('menolak menghapus akun yang punya riwayat aktivitas', async () => {
    const { service, prisma } = setup(row(3, RoleName.ADMIN_PENGINAPAN), 1, 4);
    await expect(service.remove(3, 1)).rejects.toThrow(
      new ConflictException(MSG_HAS_HISTORY),
    );
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('menghapus akun tanpa riwayat', async () => {
    const { service, prisma } = setup(row(3, RoleName.ADMIN_PENGINAPAN), 1, 0);
    await expect(service.remove(3, 1)).resolves.toEqual({ ok: true });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 3 } });
  });

  it('menolak email yang sudah dipakai saat membuat akun', async () => {
    const { service, prisma } = setup(row(3, RoleName.OWNER));
    prisma.user.findFirst.mockResolvedValue({ id: 5 });
    await expect(
      service.create({
        name: 'A',
        email: 'A@x.id',
        role: RoleName.OWNER,
        password: 'password123',
      }),
    ).rejects.toThrow(MSG_EMAIL_TAKEN);
  });

  it('tidak pernah mengembalikan password', async () => {
    const { service } = setup(row(3, RoleName.OWNER));
    const out = await service.create({
      name: 'A',
      email: 'a@x.id',
      role: RoleName.OWNER,
      password: 'password123',
    });
    expect(out).not.toHaveProperty('password');
  });
});

describe('UsersService password == email', () => {
  it('menolak membuat akun dengan kata sandi sama dengan email', async () => {
    const { service } = setup(row(1, RoleName.OWNER));
    await expect(
      service.create({
        name: 'Budi',
        email: 'budi@x.id',
        role: RoleName.OWNER,
        password: 'BUDI@x.id',
      }),
    ).rejects.toThrow('Kata sandi tidak boleh sama dengan email.');
  });
  it('menolak reset kata sandi yang sama dengan email', async () => {
    const { service } = setup(row(1, RoleName.OWNER));
    await expect(service.resetPassword(1, 'U1@x.id')).rejects.toThrow(
      'Kata sandi tidak boleh sama dengan email.',
    );
  });
});
