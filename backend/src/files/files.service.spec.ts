import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { FilesService } from './files.service';
import { FileEntity } from './file.entity';
import { UserEntity } from '../users/user.entity';
import { FileResponseDto } from './dto/file.dto';
import { Mapper } from '../common/utils/mapper.util';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('../common/utils/mapper.util');
jest.mock('../common/utils/correlation-id.util', () => ({
  CorrelationIdUtil: {
    formatLogMessage: jest.fn((message: string) => message),
  },
}));

global.fetch = jest.fn();

describe('FilesService', () => {
  let service: FilesService;
  let fileRepository: jest.Mocked<Repository<FileEntity>>;
  let configService: jest.Mocked<ConfigService>;
  let s3Client: jest.Mocked<S3Client>;

  const mockUser: UserEntity = {
    id: 'user-uuid',
    email: 'test@example.com',
    password: 'hashedPassword123',
    createdAt: new Date(),
    updatedAt: new Date(),
    files: [],
  };

  const mockFileEntity: FileEntity = {
    id: 'file-uuid',
    userId: 'user-uuid',
    filename: 'test.jpg',
    filetype: 'image/jpeg',
    size: 1024,
    key: 'user-uuid/test.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
  };

  const mockMulterFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('test file content'),
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  beforeEach(async () => {
    const mockFileRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockS3Client = {
      send: jest.fn().mockResolvedValue({}),
      config: {},
      destroy: jest.fn(),
      middlewareStack: {},
    };

    (S3Client as jest.MockedClass<typeof S3Client>).mockImplementation(
      () => mockS3Client as any,
    );
    s3Client = mockS3Client as unknown as jest.Mocked<S3Client>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: getRepositoryToken(FileEntity),
          useValue: mockFileRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    fileRepository = module.get(getRepositoryToken(FileEntity));
    configService = module.get<ConfigService>(
      ConfigService,
    ) as jest.Mocked<ConfigService>;

    configService.get.mockImplementation((key: string) => {
      const config: Record<string, string> = {
        's3.bucketName': 'test-bucket',
        's3.region': 'us-east-1',
        's3.endpoint': 'test-endpoint',
        's3.accessKeyId': 'test-key',
        's3.secretAccessKey': 'test-secret',
      };
      return config[key];
    });

    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    beforeEach(() => {
      (getSignedUrl as jest.Mock).mockResolvedValue(
        'https://presigned-url.com',
      );
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });
      (Mapper.mapData as jest.Mock).mockReturnValue(mockFileEntity);
    });

    it('should upload file successfully', async () => {
      fileRepository.create.mockReturnValue(mockFileEntity);
      fileRepository.save.mockResolvedValue(mockFileEntity);

      const result = await service.uploadFile(mockMulterFile, mockUser);

      expect(getSignedUrl).toHaveBeenCalledWith(
        s3Client,
        expect.any(PutObjectCommand),
        expect.objectContaining({ expiresIn: 3600 }),
      );
      expect(fetch).toHaveBeenCalledWith(
        'https://presigned-url.com',
        expect.objectContaining({
          method: 'PUT',
          body: mockMulterFile.buffer,
          headers: { 'Content-Type': 'image/jpeg' },
        }),
      );
      expect(fileRepository.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        filename: 'test.jpg',
        filetype: 'image/jpeg',
        size: 1024,
        key: expect.stringMatching(/^user-uuid\/.*\.jpg$/),
      });
      expect(fileRepository.save).toHaveBeenCalledWith(mockFileEntity);
      expect(result).toEqual(mockFileEntity);
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(service.uploadFile(null as any, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when file is empty', async () => {
      const emptyFile = { ...mockMulterFile, size: 0 };

      await expect(service.uploadFile(emptyFile, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid file type', async () => {
      const invalidFile = { ...mockMulterFile, mimetype: 'application/exe' };

      await expect(service.uploadFile(invalidFile, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for file too large', async () => {
      const largeFile = { ...mockMulterFile, size: 6 * 1024 * 1024 };

      await expect(service.uploadFile(largeFile, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException on S3 upload failure', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        service.uploadFile(mockMulterFile, mockUser),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException on database save failure', async () => {
      fileRepository.create.mockReturnValue(mockFileEntity);
      fileRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(
        service.uploadFile(mockMulterFile, mockUser),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getFiles', () => {
    it('should return user files list', async () => {
      const mockFiles = [mockFileEntity];
      fileRepository.find.mockResolvedValue(mockFiles);
      (Mapper.mapArrayData as jest.Mock).mockReturnValue(mockFiles);

      const result = await service.getFiles(mockUser);

      expect(fileRepository.find).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        order: { createdAt: 'DESC' },
      });
      expect(Mapper.mapArrayData).toHaveBeenCalledWith(
        FileResponseDto,
        mockFiles,
      );
      expect(result).toEqual({
        files: mockFiles,
        filesCount: 1,
      });
    });

    it('should return empty list when no files found', async () => {
      fileRepository.find.mockResolvedValue([]);
      (Mapper.mapArrayData as jest.Mock).mockReturnValue([]);

      const result = await service.getFiles(mockUser);

      expect(result).toEqual({
        files: [],
        filesCount: 0,
      });
    });
  });

  describe('downloadFile', () => {
    beforeEach(() => {
      (getSignedUrl as jest.Mock).mockResolvedValue('https://download-url.com');
    });

    it('should download file successfully', async () => {
      fileRepository.findOne.mockResolvedValue(mockFileEntity);
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
      });

      const result = await service.downloadFile('file-uuid', mockUser);

      expect(fileRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'file-uuid', userId: mockUser.id },
      });
      expect(getSignedUrl).toHaveBeenCalledWith(
        s3Client,
        expect.any(GetObjectCommand),
        expect.objectContaining({ expiresIn: 3600 }),
      );
      expect(fetch).toHaveBeenCalledWith('https://download-url.com');
      expect(result).toEqual({
        buffer: expect.any(Buffer),
        filename: 'test.jpg',
        contentType: 'image/jpeg',
      });
    });

    it('should throw NotFoundException when file not found', async () => {
      fileRepository.findOne.mockResolvedValue(null);

      await expect(service.downloadFile('file-uuid', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException on S3 download failure', async () => {
      fileRepository.findOne.mockResolvedValue(mockFileEntity);
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(service.downloadFile('file-uuid', mockUser)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      fileRepository.findOne.mockResolvedValue(mockFileEntity);
      s3Client.send.mockResolvedValue({} as never);
      fileRepository.remove.mockResolvedValue(mockFileEntity);

      await service.deleteFile('file-uuid', mockUser);

      expect(fileRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'file-uuid', userId: mockUser.id },
      });
      expect(s3Client.send).toHaveBeenCalledWith(
        expect.any(DeleteObjectCommand),
      );
      expect(fileRepository.remove).toHaveBeenCalledWith(mockFileEntity);
    });

    it('should throw NotFoundException when file not found', async () => {
      fileRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteFile('file-uuid', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException on S3 delete failure', async () => {
      fileRepository.findOne.mockResolvedValue(mockFileEntity);
      (s3Client.send as jest.Mock).mockRejectedValue(new Error('S3 Error'));

      await expect(service.deleteFile('file-uuid', mockUser)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
