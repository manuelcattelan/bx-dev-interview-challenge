import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { FileEntity } from '../../entities/file.entity';
import { UserEntity } from '../../entities/user.entity';
import {
  FileResponseDto,
  PresignedUrlDto,
  FileListDto,
} from '../../dtos/file.dto';
import { Mapper } from '../../utils/mapper/mapper';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(
    @InjectRepository(FileEntity)
    private fileRepository: Repository<FileEntity>,
    private configService: ConfigService,
  ) {
    this.bucketName =
      this.configService.get('s3.bucketName') || 'default-bucket';

    const endpoint = this.configService.get<string>('s3.endpoint');
    const region = this.configService.get<string>('s3.region') || 'us-east-1';
    const accessKeyId = this.configService.get<string>('s3.accessKeyId') || '';
    const secretAccessKey =
      this.configService.get<string>('s3.secretAccessKey') || '';

    const s3Config = {
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Required for S3-compatible services like MinIO
    };

    // Only set endpoint if it exists (for local development)
    if (s3Config.endpoint) {
      this.s3Client = new S3Client(s3Config);
    } else {
      this.s3Client = new S3Client({
        region: s3Config.region,
        credentials: s3Config.credentials,
        forcePathStyle: false,
      });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    user: UserEntity,
  ): Promise<FileResponseDto> {
    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    const fileExtension = file.originalname.split('.').pop();
    const s3Key = `${user.id}/${uuidv4()}.${fileExtension}`;

    // Upload file to S3
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      throw new BadRequestException('Failed to upload file to storage');
    }

    // Save file metadata to database
    const fileEntity = this.fileRepository.create({
      originalName: file.originalname,
      filename: s3Key.split('/').pop(),
      s3Key,
      mimeType: file.mimetype,
      size: file.size,
      userId: user.id,
    });

    const savedFile = await this.fileRepository.save(fileEntity);
    return Mapper.mapData(FileResponseDto, savedFile);
  }

  async generatePresignedUploadUrl(
    originalName: string,
    mimeType: string,
    user: UserEntity,
  ): Promise<PresignedUrlDto> {
    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException('File type not allowed');
    }

    const fileExtension = originalName.split('.').pop();
    const s3Key = `${user.id}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    });

    return {
      uploadUrl,
      fields: {},
      s3Key,
    };
  }

  async saveFileMetadata(
    originalName: string,
    mimeType: string,
    s3Key: string,
    size: number,
    user: UserEntity,
  ): Promise<FileResponseDto> {
    const fileEntity = this.fileRepository.create({
      originalName,
      filename: s3Key.split('/').pop(),
      s3Key,
      mimeType,
      size,
      userId: user.id,
    });

    const savedFile = await this.fileRepository.save(fileEntity);
    return Mapper.mapData(FileResponseDto, savedFile);
  }

  async getUserFiles(user: UserEntity): Promise<FileListDto> {
    const files = await this.fileRepository.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });

    const fileResponses = files.map((file) => {
      const fileDto = Mapper.mapData(FileResponseDto, file);
      return fileDto;
    });

    return {
      files: fileResponses,
      total: files.length,
    };
  }

  async generateDownloadUrl(fileId: string, user: UserEntity): Promise<string> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, userId: user.id },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: file.s3Key,
    });

    const downloadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    });
    return downloadUrl;
  }

  async deleteFile(fileId: string, user: UserEntity): Promise<void> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, userId: user.id },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Delete file from S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: file.s3Key,
    });

    try {
      await this.s3Client.send(deleteCommand);
    } catch (error) {
      console.error('Failed to delete file from S3:', error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Remove file metadata from database
    await this.fileRepository.remove(file);
  }
}
