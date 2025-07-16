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
    @Body() userToSignUp: SignUpDto,
  ): Promise<AuthenticationResponseDto> {
    return this.authService.signUp(userToSignUp);
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() userToSignIn: SignInDto,
  ): Promise<AuthenticationResponseDto> {
    return this.authService.signIn(userToSignIn);
  }
}
