import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

export const MSG_PASSWORD_COMPOSITION =
  'Kata sandi harus mengandung huruf dan angka.';
export const MSG_PASSWORD_EQUALS_EMAIL =
  'Kata sandi tidak boleh sama dengan email.';
export const MSG_NAME_CHARS =
  'Nama hanya boleh berisi huruf, spasi, titik, apostrof, atau tanda hubung.';

export const NAME_RE = /^\p{L}[\p{L} .'’-]*$/u;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const trimLower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

/** Kata sandi baru: 8–72 karakter, minimal satu huruf dan satu angka. */
export function PasswordRules(): PropertyDecorator {
  const decorators = [
    IsString({ message: 'Kata sandi minimal 8 karakter.' }),
    MinLength(8, { message: 'Kata sandi minimal 8 karakter.' }),
    MaxLength(72, { message: 'Kata sandi maksimal 72 karakter.' }),
    Matches(/(?=.*\p{L})(?=.*\d)/u, { message: MSG_PASSWORD_COMPOSITION }),
  ];
  return (target, key) => decorators.forEach((d) => d(target, key));
}

/** Email: dipangkas, huruf kecil, format valid, maks 191 karakter. */
export function EmailRules(): PropertyDecorator {
  const decorators = [
    Transform(trimLower),
    IsEmail({}, { message: 'Format email tidak valid.' }),
    MaxLength(191, { message: 'Email maksimal 191 karakter.' }),
  ];
  return (target, key) => decorators.forEach((d) => d(target, key));
}

/** Nama: dipangkas, 2–100 karakter, hanya huruf/spasi/titik/apostrof/hubung. */
export function NameRules(): PropertyDecorator {
  const decorators = [
    Transform(trim),
    IsString({ message: 'Nama wajib diisi.' }),
    IsNotEmpty({ message: 'Nama wajib diisi.' }),
    MinLength(2, { message: 'Nama minimal 2 karakter.' }),
    MaxLength(100, { message: 'Nama maksimal 100 karakter.' }),
    Matches(NAME_RE, { message: MSG_NAME_CHARS }),
  ];
  return (target, key) => decorators.forEach((d) => d(target, key));
}
