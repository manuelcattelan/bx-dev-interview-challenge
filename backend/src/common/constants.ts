export const HASH_SALT_ROUNDS = 10;

export const ALLOWED_FILE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const DOWNLOAD_PRESIGNED_URL_EXPIRES_IN_SECONDS = 3600;
export const UPLOAD_PRESIGNED_URL_EXPIRES_IN_SECONDS = 3600;
