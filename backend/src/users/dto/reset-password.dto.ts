import { PasswordRules } from './account-rules';

export class ResetPasswordDto {
  @PasswordRules()
  password: string;
}
