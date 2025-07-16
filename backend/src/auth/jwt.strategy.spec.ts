import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';

import { JwtStrategy } from './jwt.strategy';
import { UserEntity } from '../users/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: jest.Mocked<Repository<UserEntity>>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser: UserEntity = {
    id: 'user-uuid',
    email: 'test@example.com',
    password: 'hashedPassword123',
    createdAt: new Date(),
    updatedAt: new Date(),
    files: [],
  };

  const mockPayload = {
    sub: 'user-uuid',
    username: 'test@example.com',
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userRepository = module.get(getRepositoryToken(UserEntity));
    configService = module.get<ConfigService>(
      ConfigService,
    ) as jest.Mocked<ConfigService>;

    configService.get.mockImplementation((key: string) => {
      if (key === 'jwt.secret') return 'test-secret';
      return undefined;
    });
  });

  describe('validate', () => {
    it('should return user when valid payload provided', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockPayload);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPayload.sub },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
