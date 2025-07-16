import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppModule } from '../src/app.module';
import { UserEntity } from '../src/users/user.entity';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<UserEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    userRepository = moduleFixture.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await userRepository.clear();
  });

  describe('/auth/sign-up (POST)', () => {
    it('should create a new user', async () => {
      const signUpData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-up')
        .send(signUpData)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(typeof response.body.accessToken).toBe('string');

      const user = await userRepository.findOne({
        where: { email: signUpData.email },
      });
      expect(user).toBeDefined();
      expect(user!.email).toBe(signUpData.email);
    });

    it('should return 409 for duplicate email', async () => {
      const signUpData = {
        email: 'test@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/api/auth/sign-up')
        .send(signUpData)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-up')
        .send(signUpData)
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('should return 400 for invalid email', async () => {
      const signUpData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-up')
        .send(signUpData)
        .expect(400);

      expect(response.body.message).toContain('email');
    });

    it('should return 400 for short password', async () => {
      const signUpData = {
        email: 'test@example.com',
        password: '123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-up')
        .send(signUpData)
        .expect(400);

      expect(response.body.message).toContain('password');
    });
  });

  describe('/auth/sign-in (POST)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer()).post('/api/auth/sign-up').send({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should authenticate user with valid credentials', async () => {
      const signInData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-in')
        .send(signInData)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(typeof response.body.accessToken).toBe('string');
    });

    it('should return 401 for invalid email', async () => {
      const signInData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-in')
        .send(signInData)
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const signInData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-in')
        .send(signInData)
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });
  });
});
