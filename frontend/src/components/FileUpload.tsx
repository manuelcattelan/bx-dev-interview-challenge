import React, { useState, useCallback } from "react";
import { Box, Typography, Alert, Paper, LinearProgress } from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import filesService from "../services/files";

interface FileUploadProps {
  onUploadSuccess: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const maxFileSize = 5 * 1024 * 1024; // 5MB

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return "File type not allowed. Please upload images, PDFs, or documents.";
    }
    if (file.size > maxFileSize) {
      return "File size exceeds 5MB limit.";
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadStatus({ type: null, message: "" });

    try {
      await filesService.uploadFile(file);
      setUploadStatus({
        type: "success",
        message: `${file.name} uploaded successfully!`,
      });
      onUploadSuccess();
    } catch (error) {
      const err = error as Error;
      setUploadStatus({
        type: "error",
        message: err.message || "Upload failed",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadStatus({
        type: "error",
        message: error,
      });
      return;
    }

    uploadFile(file);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Upload File
      </Typography>

      <Paper
        elevation={1}
        sx={{
          p: 4,
          border: "2px dashed",
          borderColor: dragActive ? "primary.main" : "grey.300",
          backgroundColor: dragActive ? "action.hover" : "transparent",
          textAlign: "center",
          cursor: isUploading ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          "&:hover": {
            borderColor: isUploading ? "grey.300" : "primary.main",
            backgroundColor: isUploading ? "transparent" : "action.hover",
          },
          position: "relative",
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        role="button"
        aria-label="Drag and drop a file here or click to select a file"
        tabIndex={0}
      >
        <input
          type="file"
          accept={allowedTypes.join(",")}
          onChange={handleFileInputChange}
          style={{ display: "none" }}
          id="file-input"
          aria-describedby="file-input-description"
          disabled={isUploading}
        />
        <label
          htmlFor="file-input"
          style={{
            cursor: isUploading ? "not-allowed" : "pointer",
            display: "block",
            pointerEvents: isUploading ? "none" : "auto",
          }}
        >
          <CloudUpload sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isUploading
              ? "Uploading..."
              : "Drag and drop a file here or click to select"}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            id="file-input-description"
          >
            {isUploading
              ? "Please wait while your file is being uploaded"
              : "Supported formats: Images, PDFs, Documents • Max size: 5MB"}
          </Typography>
        </label>

        {isUploading && (
          <LinearProgress
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              borderRadius: "0 0 4px 4px",
            }}
          />
        )}
      </Paper>

      {uploadStatus.type && (
        <Alert
          severity={uploadStatus.type}
          sx={{ mt: 2 }}
          role={uploadStatus.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {uploadStatus.message}
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload;
