import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/** Body for POST /auth/login. */
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
