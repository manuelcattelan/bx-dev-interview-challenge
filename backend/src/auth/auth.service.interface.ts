import {
  SignUpDto,
  SignInDto,
  AuthenticationResponseDto,
} from './dto/auth.dto';

export interface IAuthService {
  signUp(userToSignUp: SignUpDto): Promise<AuthenticationResponseDto>;
  signIn(userToSignIn: SignInDto): Promise<AuthenticationResponseDto>;
}
