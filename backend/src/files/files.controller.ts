import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtGuard } from '../auth/jwt.guard';
import { FilesService } from './files.service';
import { FileResponseDto, FilesListResponseDto } from './dto/file.dto';
import { UserEntity } from '../users/user.entity';

interface AuthenticatedRequest extends Request {
  user: UserEntity;
}

@Controller('files')
@UseGuards(JwtGuard)
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Get()
  async getFiles(
    @Request() request: AuthenticatedRequest,
  ): Promise<FilesListResponseDto> {
    return this.filesService.getFiles(request.user);
  }

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() fileToUpload: Express.Multer.File,
    @Request() request: AuthenticatedRequest,
  ): Promise<FileResponseDto> {
    return this.filesService.uploadFile(fileToUpload, request.user);
  }

  @Get(':id/download')
  async downloadFile(
    @Param('id') fileToDownloadId: string,
    @Request() request: AuthenticatedRequest,
  ): Promise<{ presignedURL: string }> {
    const presignedURL = await this.filesService.downloadFile(
      fileToDownloadId,
      request.user,
    );

    return { presignedURL };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(
    @Param('id') fileToDeleteId: string,
    @Request() request: AuthenticatedRequest,
  ): Promise<void> {
    return this.filesService.deleteFile(fileToDeleteId, request.user);
  }
}
