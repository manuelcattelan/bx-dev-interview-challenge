import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../entities/user.entity';
import { LoginDto, RegisterDto, AuthResponseDto } from '../../dtos/auth.dto';
import { Mapper } from '../../utils/mapper/mapper';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });
    if (existingUser) {
      throw new ConflictException('User with provided email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const createdUser = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(createdUser);

    const payload = { username: savedUser.email, sub: savedUser.id };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const createdUser = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });
    if (!createdUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
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
