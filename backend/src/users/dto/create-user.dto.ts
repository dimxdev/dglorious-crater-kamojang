import { IsEnum } from 'class-validator';
import { RoleName } from '../../generated/prisma/enums';
import { EmailRules, NameRules, PasswordRules } from './account-rules';

export class CreateUserDto {
  @NameRules()
  name: string;

  @EmailRules()
  email: string;

  @IsEnum(RoleName, { message: 'Peran tidak dikenali.' })
  role: RoleName;

  @PasswordRules()
  password: string;
}
