import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { RoleName } from '../../generated/prisma/enums';
import { EmailRules, NameRules } from './account-rules';

export class UpdateUserDto {
  @IsOptional()
  @NameRules()
  name?: string;

  @IsOptional()
  @EmailRules()
  email?: string;

  @IsOptional()
  @IsEnum(RoleName, { message: 'Peran tidak dikenali.' })
  role?: RoleName;

  @IsOptional()
  @IsBoolean({ message: 'Status akun tidak valid.' })
  isActive?: boolean;
}
