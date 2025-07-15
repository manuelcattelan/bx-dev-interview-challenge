import {
  SignUpDto,
  SignInDto,
  AuthenticationResponseDto,
} from './dto/auth.dto';
import { UserEntity } from '../users/user.entity';

export interface IAuthService {
  signUp(signUpDto: SignUpDto): Promise<AuthenticationResponseDto>;
  signIn(signInDto: SignInDto): Promise<AuthenticationResponseDto>;
}
