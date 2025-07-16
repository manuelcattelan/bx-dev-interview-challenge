/**
 * @jest-environment jsdom
 */
import axios from "axios";
import filesService from "./files";
import type { File, FilesList } from "./files";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

(global as any).File = class MockFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;

  constructor(bits: BlobPart[], name: string, options?: FilePropertyBag) {
    this.name = name;
    this.type = options?.type || "";
    this.size = bits.reduce((acc, bit) => acc + bit.toString().length, 0);
    this.lastModified = Date.now();
  }
};

describe("FilesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getFiles", () => {
    it("should fetch files list", async () => {
      const mockResponse: FilesList = {
        files: [
          {
            id: "file-1",
            filename: "test.jpg",
            filetype: "image/jpeg",
            size: 1024,
            key: "user/test.jpg",
            createdAt: "2023-01-01T00:00:00Z",
          },
        ],
        filesCount: 1,
      };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await filesService.getFiles();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "http://localhost:3000/api/files"
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle fetch files error", async () => {
      const mockError = new Error("Fetch failed");
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(filesService.getFiles()).rejects.toThrow("Fetch failed");
    });
  });

  describe("uploadFile", () => {
    it("should upload file successfully", async () => {
      const mockFile = new File(["test content"], "test.jpg", {
        type: "image/jpeg",
      });
      const mockResponse: File = {
        id: "file-1",
        filename: "test.jpg",
        filetype: "image/jpeg",
        size: 1024,
        key: "user/test.jpg",
        createdAt: "2023-01-01T00:00:00Z",
      };
      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await filesService.uploadFile(mockFile);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "http://localhost:3000/api/files/upload",
        expect.any(FormData)
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle upload error", async () => {
      const mockFile = new File(["test content"], "test.jpg", {
        type: "image/jpeg",
      });
      const mockError = new Error("Upload failed");
      mockedAxios.post.mockRejectedValue(mockError);

      await expect(filesService.uploadFile(mockFile)).rejects.toThrow(
        "Upload failed"
      );
    });
  });

  describe("downloadFile", () => {
    it("should download file successfully", async () => {
      const mockBlob = new Blob(["file content"], { type: "image/jpeg" });
      mockedAxios.get.mockResolvedValue({ data: mockBlob });

      const result = await filesService.downloadFile("file-1");

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "http://localhost:3000/api/files/file-1/download",
        { responseType: "blob" }
      );
      expect(result).toEqual(mockBlob);
    });

    it("should handle download error", async () => {
      const mockError = new Error("Download failed");
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(filesService.downloadFile("file-1")).rejects.toThrow(
        "Download failed"
      );
    });
  });

  describe("deleteFile", () => {
    it("should delete file successfully", async () => {
      mockedAxios.delete.mockResolvedValue({});

      await filesService.deleteFile("file-1");

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        "http://localhost:3000/api/files/file-1"
      );
    });

    it("should handle delete error", async () => {
      const mockError = new Error("Delete failed");
      mockedAxios.delete.mockRejectedValue(mockError);

      await expect(filesService.deleteFile("file-1")).rejects.toThrow(
        "Delete failed"
      );
    });
  });
});
