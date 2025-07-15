import { Expose } from 'class-transformer';

export class FileResponseDto {
  @Expose()
  id: string;

  @Expose()
  filename: string;

  @Expose()
  filetype: string;

  @Expose()
  size: number;

  @Expose()
  createdAt: Date;
}

export class FilesListResponseDto {
  @Expose()
  files: FileResponseDto[];

  @Expose()
  filesCount: number;
}
