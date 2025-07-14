import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class FileUploadDto {
  @IsString()
  originalName: string;

  @IsString()
  mimeType: string;

  @IsString()
  filename: string;
}

export class FileResponseDto {
  @Expose()
  id: string;

  @Expose()
  originalName: string;

  @Expose()
  filename: string;

  @Expose()
  mimeType: string;

  @Expose()
  size: number;

  @Expose()
  createdAt: Date;

  @Expose()
  downloadUrl?: string;
}

export class PresignedUrlDto {
  @Expose()
  uploadUrl: string;

  @Expose()
  fields: Record<string, string>;

  @Expose()
  s3Key: string;
}

export class FileListDto {
  @Expose()
  files: FileResponseDto[];

  @Expose()
  total: number;
}
