import { IsEmail, IsString, MinLength } from 'class-validator';
import { Expose } from 'class-transformer';

export class SignUpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class AuthenticationResponseDto {
  @Expose()
  accessToken: string;
}
