import { FileResponseDto, FilesListResponseDto } from './dto/file.dto';
import { UserEntity } from '../users/user.entity';

export interface IFilesService {
  getFiles(user: UserEntity): Promise<FilesListResponseDto>;
  uploadFile(
    fileToUpload: Express.Multer.File,
    user: UserEntity,
  ): Promise<FileResponseDto>;
  downloadFile(fileToDownloadId: string, user: UserEntity): Promise<string>;
  deleteFile(fileToDeleteId: string, user: UserEntity): Promise<void>;
}
