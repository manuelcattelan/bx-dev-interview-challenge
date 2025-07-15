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
import { FileEntity } from './file.entity';
import { UserEntity } from '../users/user.entity';
import { FileResponseDto, FilesListResponseDto } from './dto/file.dto';
import { Mapper } from '../common/utils/mapper/mapper';
import { v4 as uuidv4 } from 'uuid';
import { IFilesService } from './files.service.interface';

@Injectable()
export class FilesService implements IFilesService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(
    @InjectRepository(FileEntity)
    private fileRepository: Repository<FileEntity>,
    private configService: ConfigService,
  ) {
    this.bucketName =
      this.configService.get('s3.bucketName') || 'default-bucket';

    const region = this.configService.get<string>('s3.region') || 'us-east-1';
    const endpoint =
      this.configService.get<string>('s3.endpoint') || 'your-s3-endpoint';
    const accessKeyId =
      this.configService.get<string>('s3.accessKeyId') || 'your-access-key-id';
    const secretAccessKey =
      this.configService.get<string>('s3.secretAccessKey') ||
      'your-secret-access-key';

    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true, // Required for S3 Ninja and other S3-compatible services
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    user: UserEntity,
  ): Promise<FileResponseDto> {
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

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    const fileExtension = file.originalname.split('.').pop();
    const s3Key = `${user.id}/${uuidv4()}.${fileExtension}`;

    // Generate presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      ContentType: file.mimetype,
    });

    try {
      // Generate presigned URL
      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600, // 1 hour
      });

      // Upload file using presigned URL
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file.buffer,
        headers: {
          'Content-Type': file.mimetype,
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Failed to upload file to storage');
    }

    const fileEntity = this.fileRepository.create({
      userId: user.id,
      filename: file.originalname,
      filetype: file.mimetype,
      size: file.size,
      key: s3Key,
    });

    const savedFile = await this.fileRepository.save(fileEntity);
    return Mapper.mapData(FileResponseDto, savedFile);
  }

  async getFiles(user: UserEntity): Promise<FilesListResponseDto> {
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
      filesCount: files.length,
    };
  }

  async downloadFile(fileId: string, user: UserEntity): Promise<string> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, userId: user.id },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: file.key,
    });

    const downloadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    });
    return downloadUrl;
  }

  async deleteFile(fileId: string, user: UserEntity): Promise<void> {
    const fileToDelete = await this.fileRepository.findOne({
      where: { id: fileId, userId: user.id },
    });

    if (!fileToDelete) {
      throw new NotFoundException('File not found');
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fileToDelete.key,
    });

    try {
      await this.s3Client.send(deleteCommand);
      await this.fileRepository.remove(fileToDelete);
    } catch (error) {
      throw new BadRequestException('Failed to delete file from storage');
    }
  }
}
