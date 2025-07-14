import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilesService } from './files.service';
import {
  FileResponseDto,
  PresignedUrlDto,
  FileListDto,
} from '../dtos/file.dto';
import { UserEntity } from '../entities/user.entity';

interface AuthenticatedRequest extends Request {
  user: UserEntity;
}

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload-url')
  @HttpCode(HttpStatus.OK)
  async getUploadUrl(
    @Body() body: { originalName: string; mimeType: string },
    @Request() req: AuthenticatedRequest,
  ): Promise<PresignedUrlDto> {
    return this.filesService.generatePresignedUploadUrl(
      body.originalName,
      body.mimeType,
      req.user,
    );
  }

  @Post('metadata')
  @HttpCode(HttpStatus.CREATED)
  async saveFileMetadata(
    @Body()
    body: {
      originalName: string;
      mimeType: string;
      s3Key: string;
      size: number;
    },
    @Request() req: AuthenticatedRequest,
  ): Promise<FileResponseDto> {
    return this.filesService.saveFileMetadata(
      body.originalName,
      body.mimeType,
      body.s3Key,
      body.size,
      req.user,
    );
  }

  @Get()
  async getUserFiles(
    @Request() req: AuthenticatedRequest,
  ): Promise<FileListDto> {
    return this.filesService.getUserFiles(req.user);
  }

  @Get(':id/download')
  async getDownloadUrl(
    @Param('id') fileId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ downloadUrl: string }> {
    const downloadUrl = await this.filesService.generateDownloadUrl(
      fileId,
      req.user,
    );
    return { downloadUrl };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(
    @Param('id') fileId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.filesService.deleteFile(fileId, req.user);
  }
}
