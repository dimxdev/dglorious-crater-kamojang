import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

const check = (o: object) => {
  const dto = plainToInstance(CreateUserDto, o);
  return {
    dto,
    msgs: validateSync(dto).flatMap((e) => Object.values(e.constraints ?? {})),
  };
};
const ok = {
  name: "Budi O'Neil-Santoso Jr.",
  email: '  Budi@Mail.com ',
  role: 'OWNER',
  password: 'abcd1234',
};

describe('aturan akun', () => {
  it('menerima data valid dan menormalkan email', () => {
    const { dto, msgs } = check(ok);
    expect(msgs).toEqual([]);
    expect(dto.email).toBe('budi@mail.com');
  });
  it('menolak kata sandi tanpa angka / tanpa huruf', () => {
    expect(check({ ...ok, password: 'abcdefgh' }).msgs).toContain(
      'Kata sandi harus mengandung huruf dan angka.',
    );
    expect(check({ ...ok, password: '12345678' }).msgs).toContain(
      'Kata sandi harus mengandung huruf dan angka.',
    );
  });
  it('menolak nama berisi angka atau 1 huruf', () => {
    expect(check({ ...ok, name: 'Budi123' }).msgs).toContain(
      'Nama hanya boleh berisi huruf, spasi, titik, apostrof, atau tanda hubung.',
    );
    expect(check({ ...ok, name: 'B' }).msgs).toContain(
      'Nama minimal 2 karakter.',
    );
  });
  it('menolak email tidak valid', () => {
    expect(check({ ...ok, email: 'x' }).msgs).toContain(
      'Format email tidak valid.',
    );
  });
});
