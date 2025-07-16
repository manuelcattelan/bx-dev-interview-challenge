import axios, { AxiosResponse } from "axios";
import { API_BASE_URL } from "../constants/config";

export interface File {
  id: string;
  filename: string;
  filetype: string;
  size: number;
  key: string;
  createdAt: string;
}

export interface FilesList {
  files: File[];
  filesCount: number;
}

class FilesService {
  async getFiles(): Promise<FilesList> {
    const response: AxiosResponse<FilesList> = await axios.get(
      `${API_BASE_URL}/files`
    );
    return response.data;
  }

  async uploadFile(file: globalThis.File): Promise<File> {
    const formData = new FormData();
    formData.append("file", file);

    const response: AxiosResponse<File> = await axios.post(
      `${API_BASE_URL}/files/upload`,
      formData
    );

    return response.data;
  }

  async downloadFile(fileId: string): Promise<string> {
    const response: AxiosResponse<string> = await axios.get(
      `${API_BASE_URL}/files/${fileId}/download`
    );
    return response.data;
  }

  async deleteFile(fileId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/files/${fileId}`);
  }
}

export default new FilesService();
