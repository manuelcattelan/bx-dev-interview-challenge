/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";
import FileUpload from "./FileUpload";
import filesService from "../services/files";
import { useToast } from "../hooks/useToast";

jest.mock("../services/files");
jest.mock("../hooks/useToast");

const mockFilesService = filesService as jest.Mocked<typeof filesService>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

const mockToast = {
  showSuccessNotification: jest.fn(),
  showErrorNotification: jest.fn(),
  showNotification: jest.fn(),
};

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("FileUpload", () => {
  const mockOnFileUploaded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToast.mockReturnValue(mockToast);
  });

  it("should render file upload component", () => {
    renderWithTheme(<FileUpload onFileUploaded={mockOnFileUploaded} />);

    expect(
      screen.getByText(/drag and drop a file here or click to select/i)
    ).toBeTruthy();
    expect(screen.getByText(/supported formats:/i)).toBeTruthy();
  });

  it("should upload file successfully", async () => {
    const file = new File(["test content"], "test.jpg", { type: "image/jpeg" });
    mockFilesService.uploadFile.mockResolvedValue({
      id: "file-1",
      filename: "test.jpg",
      filetype: "image/jpeg",
      size: 1024,
      key: "user/test.jpg",
      createdAt: "2023-01-01T00:00:00Z",
    });

    renderWithTheme(<FileUpload onFileUploaded={mockOnFileUploaded} />);

    const fileInput = screen.getByDisplayValue("") as HTMLInputElement;

    Object.defineProperty(fileInput, "files", {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockFilesService.uploadFile).toHaveBeenCalledWith(file);
    });
    expect(mockToast.showSuccessNotification).toHaveBeenCalledWith(
      "test.jpg uploaded successfully!"
    );
    expect(mockOnFileUploaded).toHaveBeenCalled();
  });

  it("should show error for invalid file type", async () => {
    const file = new File(["test content"], "test.exe", {
      type: "application/exe",
    });

    renderWithTheme(<FileUpload onFileUploaded={mockOnFileUploaded} />);

    const fileInput = screen.getByDisplayValue("") as HTMLInputElement;

    Object.defineProperty(fileInput, "files", {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockToast.showErrorNotification).toHaveBeenCalledWith(
        "File type not allowed. Please upload images, PDFs, or documents."
      );
    });
    expect(mockFilesService.uploadFile).not.toHaveBeenCalled();
  });

  it("should show error for file too large", async () => {
    const largeFile = new File(["x".repeat(6 * 1024 * 1024)], "large.jpg", {
      type: "image/jpeg",
    });

    renderWithTheme(<FileUpload onFileUploaded={mockOnFileUploaded} />);

    const fileInput = screen.getByDisplayValue("") as HTMLInputElement;

    Object.defineProperty(fileInput, "files", {
      value: [largeFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockToast.showErrorNotification).toHaveBeenCalledWith(
        "File size exceeds 5MB limit."
      );
    });
    expect(mockFilesService.uploadFile).not.toHaveBeenCalled();
  });

  it("should handle upload failure", async () => {
    const file = new File(["test content"], "test.jpg", { type: "image/jpeg" });
    mockFilesService.uploadFile.mockRejectedValue(new Error("Upload failed"));

    renderWithTheme(<FileUpload onFileUploaded={mockOnFileUploaded} />);

    const fileInput = screen.getByDisplayValue("") as HTMLInputElement;

    Object.defineProperty(fileInput, "files", {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockToast.showErrorNotification).toHaveBeenCalledWith(
        "Upload failed"
      );
    });
    expect(mockOnFileUploaded).not.toHaveBeenCalled();
  });

  it("should handle drag and drop", async () => {
    const file = new File(["test content"], "test.jpg", { type: "image/jpeg" });
    mockFilesService.uploadFile.mockResolvedValue({
      id: "file-1",
      filename: "test.jpg",
      filetype: "image/jpeg",
      size: 1024,
      key: "user/test.jpg",
      createdAt: "2023-01-01T00:00:00Z",
    });

    renderWithTheme(<FileUpload onFileUploaded={mockOnFileUploaded} />);

    const dropZone = screen
      .getByText(/drag and drop a file here or click to select/i)
      .closest("div");

    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(mockFilesService.uploadFile).toHaveBeenCalledWith(file);
    });
  });

  it("should show loading state during upload", async () => {
    const file = new File(["test content"], "test.jpg", { type: "image/jpeg" });
    let resolveUpload: (value: any) => void;
    const uploadPromise = new Promise((resolve) => {
      resolveUpload = resolve;
    });
    mockFilesService.uploadFile.mockReturnValue(uploadPromise as any);

    renderWithTheme(<FileUpload onFileUploaded={mockOnFileUploaded} />);

    const fileInput = screen.getByDisplayValue("") as HTMLInputElement;

    Object.defineProperty(fileInput, "files", {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.queryByText(/uploading/i)).toBeTruthy();
    });

    resolveUpload!({
      id: "file-1",
      filename: "test.jpg",
      filetype: "image/jpeg",
      size: 1024,
      key: "user/test.jpg",
      createdAt: "2023-01-01T00:00:00Z",
    });

    await waitFor(() => {
      expect(screen.queryByText(/uploading/i)).toBeFalsy();
    });
  });

  it("should show drag over state", () => {
    renderWithTheme(<FileUpload onFileUploaded={mockOnFileUploaded} />);

    const dropZone = screen
      .getByText(/drag and drop a file here or click to select/i)
      .closest("div");

    fireEvent.dragOver(dropZone!);

    expect(dropZone).toBeTruthy();
  });

  it("should clear drag over state on drag leave", () => {
    renderWithTheme(<FileUpload onFileUploaded={mockOnFileUploaded} />);

    const dropZone = screen
      .getByText(/drag and drop a file here or click to select/i)
      .closest("div");

    fireEvent.dragOver(dropZone!);
    fireEvent.dragLeave(dropZone!);

    expect(dropZone?.classList.contains("drag-over")).toBe(false);
  });
});
