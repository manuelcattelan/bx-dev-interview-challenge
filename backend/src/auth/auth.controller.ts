import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  SignInDto,
  SignUpDto,
  AuthenticationResponseDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  async signUp(
    @Body() signUpDto: SignUpDto,
  ): Promise<AuthenticationResponseDto> {
    return this.authService.signUp(signUpDto);
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() signInDto: SignInDto,
  ): Promise<AuthenticationResponseDto> {
    return this.authService.signIn(signInDto);
  }
}
