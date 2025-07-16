import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../users/user.entity';
import { HASH_SALT_ROUNDS } from '../common/constants';
import { CorrelationIdUtil } from '../common/utils/correlation-id.util';
import {
  SignInDto,
  SignUpDto,
  AuthenticationResponseDto,
} from './dto/auth.dto';
import { IAuthService } from './auth.service.interface';

@Injectable()
export class AuthService implements IAuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {}

  async signUp(userToSignUp: SignUpDto): Promise<AuthenticationResponseDto> {
    this.logger.log(
      CorrelationIdUtil.formatLogMessage(
        `Sign up attempt for email: ${userToSignUp.email}`,
      ),
    );

    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: userToSignUp.email },
      });
      if (existingUser) {
        this.logger.warn(
          CorrelationIdUtil.formatLogMessage(
            `Sign up failed - user already exists: ${userToSignUp.email}`,
          ),
        );
        throw new ConflictException(
          'User with provided email already exists. Please try a different one.',
        );
      }

      const hashedPassword = await bcrypt.hash(
        userToSignUp.password,
        HASH_SALT_ROUNDS,
      );
      const createdUser = this.userRepository.create({
        ...userToSignUp,
        password: hashedPassword,
      });

      const savedUser = await this.userRepository.save(createdUser);
      this.logger.log(
        CorrelationIdUtil.formatLogMessage(
          `User signed up successfully: ${savedUser.email}`,
        ),
      );

      const payload = { username: savedUser.email, sub: savedUser.id };
      const accessToken = this.jwtService.sign(payload);

      return { accessToken };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        CorrelationIdUtil.formatLogMessage(
          `Sign up failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        ),
      );
      throw new InternalServerErrorException(
        'Failed to create user account. Please try again later.',
      );
    }
  }

  async signIn(userToSignIn: SignInDto): Promise<AuthenticationResponseDto> {
    this.logger.log(
      CorrelationIdUtil.formatLogMessage(
        `Sign in attempt for email: ${userToSignIn.email}`,
      ),
    );

    const foundUser = await this.userRepository.findOne({
      where: { email: userToSignIn.email },
    });
    if (!foundUser) {
      this.logger.warn(
        CorrelationIdUtil.formatLogMessage(
          `Sign in failed - user not found: ${userToSignIn.email}`,
        ),
      );
      throw new UnauthorizedException('Invalid credentials. Please try again.');
    }

    const isPasswordValid = await bcrypt.compare(
      userToSignIn.password,
      foundUser.password,
    );
    if (!isPasswordValid) {
      this.logger.warn(
        CorrelationIdUtil.formatLogMessage(
          `Sign in failed - invalid password: ${userToSignIn.email}`,
        ),
      );
      throw new UnauthorizedException('Invalid credentials. Please try again.');
    }

    this.logger.log(
      CorrelationIdUtil.formatLogMessage(
        `User signed in successfully: ${foundUser.email}`,
      ),
    );
    const payload = { username: foundUser.email, sub: foundUser.id };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}
