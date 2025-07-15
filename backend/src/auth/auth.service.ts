import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../users/user.entity';
import {
  SignInDto,
  SignUpDto,
  AuthenticationResponseDto,
} from './dto/auth.dto';
import { IAuthService } from './auth.service.interface';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<AuthenticationResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: { email: signUpDto.email },
    });
    if (existingUser) {
      throw new ConflictException('User with provided email already exists');
    }

    const hashedPassword = await bcrypt.hash(signUpDto.password, 10);
    const createdUser = this.userRepository.create({
      ...signUpDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(createdUser);

    const payload = { username: savedUser.email, sub: savedUser.id };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async signIn(signInDto: SignInDto): Promise<AuthenticationResponseDto> {
    const createdUser = await this.userRepository.findOne({
      where: { email: signInDto.email },
    });
    if (!createdUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      signInDto.password,
      createdUser.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { username: createdUser.email, sub: createdUser.id };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}
