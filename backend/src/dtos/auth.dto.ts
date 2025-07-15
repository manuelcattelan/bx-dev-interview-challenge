import { IsEmail, IsString, MinLength } from 'class-validator';
import { Expose } from 'class-transformer';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class AuthResponseDto {
  @Expose()
  accessToken: string;
}
