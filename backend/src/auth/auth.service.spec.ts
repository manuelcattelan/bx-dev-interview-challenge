import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { UserEntity } from '../users/user.entity';
import { SignUpDto, SignInDto } from './dto/auth.dto';

jest.mock('bcrypt');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

jest.mock('../common/utils/correlation-id.util', () => ({
  CorrelationIdUtil: {
    formatLogMessage: jest.fn((message: string) => message),
  },
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<UserEntity>>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: UserEntity = {
    id: 'user-uuid',
    email: 'test@example.com',
    password: 'hashedPassword123',
    createdAt: new Date(),
    updatedAt: new Date(),
    files: [],
  };

  const mockSignUpDto: SignUpDto = {
    email: 'test@example.com',
    password: 'password123',
  };

  const mockSignInDto: SignInDto = {
    email: 'test@example.com',
    password: 'password123',
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(UserEntity));
    jwtService = module.get<JwtService>(JwtService) as jest.Mocked<JwtService>;

    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should create a new user and return access token', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.signUp(mockSignUpDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockSignUpDto.email },
      });
      expect(bcryptMock.hash).toHaveBeenCalledWith(mockSignUpDto.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...mockSignUpDto,
        password: 'hashedPassword123',
      });
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: mockUser.email,
        sub: mockUser.id,
      });
      expect(result).toEqual({ accessToken: 'jwt-token' });
    });

    it('should throw ConflictException when user already exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.signUp(mockSignUpDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockSignUpDto.email },
      });
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on database error', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.save.mockRejectedValue(new Error('Database error'));
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      userRepository.create.mockReturnValue(mockUser);

      await expect(service.signUp(mockSignUpDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException on bcrypt error', async () => {
      userRepository.findOne.mockResolvedValue(null);
      (bcryptMock.hash as jest.Mock).mockRejectedValue(
        new Error('Bcrypt error'),
      );

      await expect(service.signUp(mockSignUpDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('signIn', () => {
    it('should authenticate user and return access token', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.signIn(mockSignInDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockSignInDto.email },
      });
      expect(bcryptMock.compare).toHaveBeenCalledWith(
        mockSignInDto.password,
        mockUser.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: mockUser.email,
        sub: mockUser.id,
      });
      expect(result).toEqual({ accessToken: 'jwt-token' });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.signIn(mockSignInDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockSignInDto.email },
      });
      expect(bcryptMock.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.signIn(mockSignInDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockSignInDto.email },
      });
      expect(bcryptMock.compare).toHaveBeenCalledWith(
        mockSignInDto.password,
        mockUser.password,
      );
    });

    it('should throw Error on bcrypt error', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcryptMock.compare as jest.Mock).mockRejectedValue(
        new Error('Bcrypt error'),
      );

      await expect(service.signIn(mockSignInDto)).rejects.toThrow(Error);
    });
  });
});
