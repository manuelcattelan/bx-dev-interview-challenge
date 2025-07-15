import { FileResponseDto, FilesListResponseDto } from './dto/file.dto';
import { UserEntity } from '../users/user.entity';

export interface IFilesService {
  getFiles(user: UserEntity): Promise<FilesListResponseDto>;
  uploadFile(
    file: Express.Multer.File,
    user: UserEntity,
  ): Promise<FileResponseDto>;
  downloadFile(fileId: string, user: UserEntity): Promise<string>;
  deleteFile(fileId: string, user: UserEntity): Promise<void>;
}
