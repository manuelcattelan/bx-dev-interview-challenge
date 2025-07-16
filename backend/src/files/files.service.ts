import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
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
import { Mapper } from '../common/utils/mapper.util';
import {
  UPLOAD_PRESIGNED_URL_EXPIRES_IN_SECONDS,
  DOWNLOAD_PRESIGNED_URL_EXPIRES_IN_SECONDS,
  ALLOWED_MIME_TYPES,
  ALLOWED_FILE_SIZE,
} from '../common/constants';
import { CorrelationIdUtil } from '../common/utils/correlation-id.util';
import { v4 as uuidv4 } from 'uuid';
import { IFilesService } from './files.service.interface';

@Injectable()
export class FilesService implements IFilesService {
  private readonly logger = new Logger(FilesService.name);
  private s3Client: S3Client;
  private s3Bucket: string;

  constructor(
    @InjectRepository(FileEntity)
    private fileRepository: Repository<FileEntity>,
    private configService: ConfigService,
  ) {
    this.s3Bucket = this.configService.get('s3.bucketName') || 'default-bucket';

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
      forcePathStyle: true,
    });
  }

  async uploadFile(
    fileToUpload: Express.Multer.File,
    user: UserEntity,
  ): Promise<FileResponseDto> {
    if (!fileToUpload) {
      this.logger.warn(
        CorrelationIdUtil.formatLogMessage(
          'Failed to upload file - no file provided',
        ),
      );
      throw new BadRequestException('No file provided');
    }

    if (fileToUpload.size === 0) {
      this.logger.warn(
        CorrelationIdUtil.formatLogMessage(
          'Failed to upload file - empty file',
        ),
      );
      throw new BadRequestException('File cannot be empty');
    }

    if (
      !ALLOWED_MIME_TYPES.includes(
        fileToUpload.mimetype as (typeof ALLOWED_MIME_TYPES)[number],
      )
    ) {
      this.logger.warn(
        CorrelationIdUtil.formatLogMessage(
          `Failed to validate file - invalid type: ${fileToUpload.mimetype}`,
        ),
      );
      throw new BadRequestException('File type not allowed');
    }

    if (fileToUpload.size > ALLOWED_FILE_SIZE) {
      this.logger.warn(
        CorrelationIdUtil.formatLogMessage(
          `Failed to validate file - size too large: ${fileToUpload.size} bytes`,
        ),
      );
      throw new BadRequestException(
        `File size exceeds ${ALLOWED_FILE_SIZE / 1024 / 1024}MB limit`,
      );
    }

    const uploadedFileExtension = fileToUpload.originalname.split('.').pop();
    const uploadedFileKey = `${user.id}/${uuidv4()}.${uploadedFileExtension}`;

    const uploadCommand = new PutObjectCommand({
      Bucket: this.s3Bucket,
      Key: uploadedFileKey,
      ContentType: fileToUpload.mimetype,
    });

    try {
      const presignedURL = await getSignedUrl(this.s3Client, uploadCommand, {
        expiresIn: UPLOAD_PRESIGNED_URL_EXPIRES_IN_SECONDS,
      });

      const uploadResponse = await fetch(presignedURL, {
        method: 'PUT',
        body: fileToUpload.buffer,
        headers: { 'Content-Type': fileToUpload.mimetype },
      });

      if (!uploadResponse.ok) {
        this.logger.error(
          CorrelationIdUtil.formatLogMessage(
            `Failed to upload file to storage - ${uploadResponse.statusText}`,
          ),
        );
        throw new InternalServerErrorException(
          'Failed to upload file to storage',
        );
      }

      this.logger.log(
        CorrelationIdUtil.formatLogMessage(
          `File uploaded to storage: ${uploadedFileKey}`,
        ),
      );
    } catch (error) {
      this.logger.error(
        CorrelationIdUtil.formatLogMessage(
          `Failed to upload file to storage: ${error instanceof Error ? error.message : 'unknown error'}`,
        ),
      );
      throw new InternalServerErrorException(
        'Failed to upload file to storage',
      );
    }

    try {
      const createdFile = this.fileRepository.create({
        userId: user.id,
        filename: fileToUpload.originalname,
        filetype: fileToUpload.mimetype,
        size: fileToUpload.size,
        key: uploadedFileKey,
      });

      const savedFile = await this.fileRepository.save(createdFile);
      this.logger.log(
        CorrelationIdUtil.formatLogMessage(
          `File saved to database: ${savedFile.id}`,
        ),
      );

      return Mapper.mapData(FileResponseDto, savedFile);
    } catch (error) {
      this.logger.error(
        CorrelationIdUtil.formatLogMessage(
          `Failed to save file to database: ${error instanceof Error ? error.message : 'unknown error'}`,
        ),
      );
      throw new InternalServerErrorException('Failed to save file');
    }
  }

  async getFiles(user: UserEntity): Promise<FilesListResponseDto> {
    const userFiles = await this.fileRepository.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });

    return {
      files: Mapper.mapArrayData(FileResponseDto, userFiles),
      filesCount: userFiles.length,
    };
  }

  async downloadFile(
    fileToDownloadId: string,
    user: UserEntity,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    try {
      const fileToDownload = await this.fileRepository.findOne({
        where: { id: fileToDownloadId, userId: user.id },
      });

      if (!fileToDownload) {
        this.logger.warn(
          CorrelationIdUtil.formatLogMessage(
            `Failed to generate download URL - file not found or not owned: ${fileToDownloadId}`,
          ),
        );
        throw new NotFoundException('File not found');
      }

      const presignedURLCommand = new GetObjectCommand({
        Bucket: this.s3Bucket,
        Key: fileToDownload.key,
      });

      const presignedURL = await getSignedUrl(
        this.s3Client,
        presignedURLCommand,
        { expiresIn: DOWNLOAD_PRESIGNED_URL_EXPIRES_IN_SECONDS },
      );

      const downloadResponse = await fetch(presignedURL);

      if (!downloadResponse.ok) {
        this.logger.error(
          CorrelationIdUtil.formatLogMessage(
            `Failed to download file from storage - ${downloadResponse.statusText}`,
          ),
        );
        throw new InternalServerErrorException(
          'Failed to download file from storage',
        );
      }

      this.logger.log(
        CorrelationIdUtil.formatLogMessage(
          `File downloaded from storage for ${fileToDownloadId}`,
        ),
      );

      return {
        buffer: Buffer.from(await downloadResponse.arrayBuffer()),
        filename: fileToDownload.filename,
        contentType: fileToDownload.filetype,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        CorrelationIdUtil.formatLogMessage(
          `Failed to download file: ${error instanceof Error ? error.message : 'unknown error'}`,
        ),
      );
      throw new InternalServerErrorException('Failed to download file');
    }
  }

  async deleteFile(fileToDeleteId: string, user: UserEntity): Promise<void> {
    try {
      const fileToDelete = await this.fileRepository.findOne({
        where: { id: fileToDeleteId, userId: user.id },
      });

      if (!fileToDelete) {
        this.logger.warn(
          CorrelationIdUtil.formatLogMessage(
            `Failed to delete file - file not found or not owned: ${fileToDeleteId}`,
          ),
        );
        throw new NotFoundException('File not found');
      }

      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.s3Bucket,
        Key: fileToDelete.key,
      });

      await this.s3Client.send(deleteCommand);
      this.logger.log(
        CorrelationIdUtil.formatLogMessage(
          `File deleted from storage: ${fileToDelete.key}`,
        ),
      );

      await this.fileRepository.remove(fileToDelete);
      this.logger.log(
        CorrelationIdUtil.formatLogMessage(
          `File deleted from database: ${fileToDeleteId}`,
        ),
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        CorrelationIdUtil.formatLogMessage(
          `Failed to delete file: ${error instanceof Error ? error.message : 'unknown error'}`,
        ),
      );
      throw new InternalServerErrorException('Failed to delete file');
    }
  }
}
