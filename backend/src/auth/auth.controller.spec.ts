import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  SignUpDto,
  SignInDto,
  AuthenticationResponseDto,
} from './dto/auth.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockSignUpDto: SignUpDto = {
    email: 'test@example.com',
    password: 'password123',
  };

  const mockSignInDto: SignInDto = {
    email: 'test@example.com',
    password: 'password123',
  };

  const mockAuthResponse: AuthenticationResponseDto = {
    accessToken: 'jwt-token',
  };

  beforeEach(async () => {
    const mockAuthService = {
      signUp: jest.fn(),
      signIn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(
      AuthService,
    ) as jest.Mocked<AuthService>;
  });

  describe('signUp', () => {
    it('should create a new user successfully', async () => {
      authService.signUp.mockResolvedValue(mockAuthResponse);

      const result = await controller.signUp(mockSignUpDto);

      expect(authService.signUp).toHaveBeenCalledWith(mockSignUpDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw ConflictException when user already exists', async () => {
      authService.signUp.mockRejectedValue(
        new ConflictException('User already exists'),
      );

      await expect(controller.signUp(mockSignUpDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('signIn', () => {
    it('should authenticate user successfully', async () => {
      authService.signIn.mockResolvedValue(mockAuthResponse);

      const result = await controller.signIn(mockSignInDto);

      expect(authService.signIn).toHaveBeenCalledWith(mockSignInDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      authService.signIn.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.signIn(mockSignInDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
