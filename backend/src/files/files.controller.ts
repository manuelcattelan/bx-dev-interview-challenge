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
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtGuard } from '../auth/jwt.guard';
import { FilesService } from './files.service';
import { FileResponseDto, FilesListResponseDto } from './dto/file.dto';
import { UserEntity } from '../users/user.entity';
import { Response } from 'express';

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
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, filename, contentType } =
      await this.filesService.downloadFile(fileToDownloadId, request.user);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
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
