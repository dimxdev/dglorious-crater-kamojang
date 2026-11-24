import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Body for POST /auth/login. */
export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Format email tidak valid.' })
  @MaxLength(191, { message: 'Email terlalu panjang.' })
  email: string;

  @IsString({ message: 'Kata sandi wajib diisi.' })
  @IsNotEmpty({ message: 'Kata sandi wajib diisi.' })
  @MinLength(6, { message: 'Kata sandi minimal 6 karakter.' })
  @MaxLength(72, { message: 'Kata sandi maksimal 72 karakter.' })
  password: string;
}
