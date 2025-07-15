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
import {
  FileResponseDto,
  FilesListResponseDto,
  FileUploadDto,
} from './dto/file.dto';
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
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async uploadFile(
    @UploadedFile() uploadedFile: Express.Multer.File,
    @Body() fileUploadDto: FileUploadDto,
    @Request() request: AuthenticatedRequest,
  ): Promise<FileResponseDto> {
    if (!uploadedFile) {
      throw new BadRequestException('No file provided');
    }

    // Validate file size and type will be handled by the service
    // But we can add some basic validation here as well
    if (uploadedFile.size === 0) {
      throw new BadRequestException('File cannot be empty');
    }

    // Use filename from DTO if provided, otherwise use the original filename
    const filename = fileUploadDto.filename || uploadedFile.originalname;

    // Use filetype from DTO if provided, otherwise use the detected mimetype
    const filetype = fileUploadDto.filetype || uploadedFile.mimetype;

    // Validate that we have a valid filename
    if (!filename || filename.trim() === '') {
      throw new BadRequestException('Filename is required');
    }

    // Create a modified file object with the validated metadata
    const fileToUpload = {
      ...uploadedFile,
      originalname: filename,
      mimetype: filetype,
    };

    return this.filesService.uploadFile(fileToUpload, request.user);
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
