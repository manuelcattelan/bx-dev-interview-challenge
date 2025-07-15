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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilesService } from './files.service';
import { FileResponseDto, FilesListResponseDto } from './dto/file.dto';
import { UserEntity } from '../users/user.entity';

interface AuthenticatedRequest extends Request {
  user: UserEntity;
}

@Controller('files')
@UseGuards(JwtAuthGuard)
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
    @UploadedFile() uploadedFile: Express.Multer.File,
    @Request() request: AuthenticatedRequest,
  ): Promise<FileResponseDto> {
    if (!uploadedFile) {
      throw new BadRequestException('No file provided');
    }

    if (uploadedFile.size === 0) {
      throw new BadRequestException('File cannot be empty');
    }

    // Server computes filename and filetype from the uploaded file
    return this.filesService.uploadFile(uploadedFile, request.user);
  }

  @Get(':id/download')
  async downloadFile(
    @Param('id') fileId: string,
    @Request() request: AuthenticatedRequest,
  ): Promise<{ url: string }> {
    const url = await this.filesService.downloadFile(fileId, request.user);
    return { url };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(
    @Param('id') fileId: string,
    @Request() request: AuthenticatedRequest,
  ): Promise<void> {
    return this.filesService.deleteFile(fileId, request.user);
  }
}
