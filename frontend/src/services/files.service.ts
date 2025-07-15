import axios, { AxiosResponse } from "axios";

const API_BASE_URL = "http://localhost:3000/api";

export interface FileMetadata {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
  downloadUrl?: string;
}

export interface FileList {
  files: FileMetadata[];
  total: number;
}

export interface PresignedUrl {
  uploadUrl: string;
  fields: Record<string, string>;
  s3Key: string;
}

class FilesService {
  async getUploadUrl(
    originalName: string,
    mimeType: string
  ): Promise<PresignedUrl> {
    const response: AxiosResponse<PresignedUrl> = await axios.post(
      `${API_BASE_URL}/files/upload-url`,
      { originalName, mimeType }
    );
    return response.data;
  }

  async uploadFileToS3(file: File, uploadUrl: string): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);

    await axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": file.type,
      },
    });
  }

  async saveFileMetadata(
    originalName: string,
    mimeType: string,
    s3Key: string,
    size: number
  ): Promise<FileMetadata> {
    const response: AxiosResponse<FileMetadata> = await axios.post(
      `${API_BASE_URL}/files/metadata`,
      { originalName, mimeType, s3Key, size }
    );
    return response.data;
  }

  async getUserFiles(): Promise<FileList> {
    const response: AxiosResponse<FileList> = await axios.get(
      `${API_BASE_URL}/files`
    );
    return response.data;
  }

  async getDownloadUrl(fileId: string): Promise<string> {
    const response: AxiosResponse<{ downloadUrl: string }> = await axios.get(
      `${API_BASE_URL}/files/${fileId}/download`
    );
    return response.data.downloadUrl;
  }

  async deleteFile(fileId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/files/${fileId}`);
  }

  async uploadFile(file: File): Promise<FileMetadata> {
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("File size exceeds 5MB limit");
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error("File type not allowed");
    }

    try {
      // Upload file directly to backend
      const formData = new FormData();
      formData.append("file", file);

      const response: AxiosResponse<FileMetadata> = await axios.post(
        `${API_BASE_URL}/files/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to upload file"
      );
    }
  }

  // Legacy method for presigned URL uploads (kept for backward compatibility)
  async uploadFileViaPresignedUrl(file: File): Promise<FileMetadata> {
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("File size exceeds 5MB limit");
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error("File type not allowed");
    }

    try {
      // Step 1: Get presigned URL
      const presignedUrl = await this.getUploadUrl(file.name, file.type);

      // Step 2: Upload file to S3
      await this.uploadFileToS3(file, presignedUrl.uploadUrl);

      // Step 3: Save metadata
      const metadata = await this.saveFileMetadata(
        file.name,
        file.type,
        presignedUrl.s3Key,
        file.size
      );

      return metadata;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to upload file"
      );
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  getFileTypeIcon(mimeType: string): string {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType === "application/pdf") return "📄";
    if (mimeType.includes("word")) return "📝";
    if (mimeType === "text/plain") return "📄";
    return "📄";
  }
}

export default new FilesService();
