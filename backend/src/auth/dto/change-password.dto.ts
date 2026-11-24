import { IsNotEmpty, IsString } from 'class-validator';
import { PasswordRules } from '../../users/dto/account-rules';

/** Body for PATCH /auth/password. */
export class ChangePasswordDto {
  @IsString({ message: 'Kata sandi saat ini wajib diisi.' })
  @IsNotEmpty({ message: 'Kata sandi saat ini wajib diisi.' })
  currentPassword: string;

  @PasswordRules()
  newPassword: string;
}
