import React, { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from "@mui/material";
import {
  CloudUpload,
  AttachFile,
  CheckCircle,
  Error,
} from "@mui/icons-material";
import filesService, { File as FileResponse } from "../services/files.service";

interface FileUploadProps {
  onUploadSuccess: () => void;
}

interface FileWithStatus {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: FileWithStatus[] = [];

    Array.from(fileList).forEach((file) => {
      const error = validateFile(file);
      newFiles.push({
        file,
        status: error ? "error" : "pending",
        error: error || undefined,
      });
    });

    setFiles((prev) => [...prev, ...newFiles]);
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
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const uploadFile = async (fileWithStatus: FileWithStatus, index: number) => {
    try {
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: "uploading" } : f))
      );

      await filesService.uploadFile(fileWithStatus.file);

      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: "success" } : f))
      );

      onUploadSuccess();
    } catch (error) {
      const err = error as Error;
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: "error",
                error: err.message || "Upload failed",
              }
            : f
        )
      );
    }
  };

  const handleUploadAll = async () => {
    const validFiles = files.filter((f) => f.status === "pending");
    if (validFiles.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "pending") {
        await uploadFile(files[i], i);
      }
    }

    setIsUploading(false);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle color="success" />;
      case "error":
        return <Error color="error" />;
      case "uploading":
        return <LinearProgress sx={{ width: "100%" }} />;
      default:
        return <AttachFile />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "success";
      case "error":
        return "error";
      case "uploading":
        return "info";
      default:
        return "default";
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Upload Files
      </Typography>

      <Paper
        elevation={1}
        sx={{
          p: 4,
          border: "2px dashed",
          borderColor: dragActive ? "primary.main" : "grey.300",
          backgroundColor: dragActive ? "action.hover" : "transparent",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s ease",
          "&:hover": {
            borderColor: "primary.main",
            backgroundColor: "action.hover",
          },
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        role="button"
        aria-label="Drag and drop files here or click to select files"
        tabIndex={0}
      >
        <input
          type="file"
          multiple
          accept={allowedTypes.join(",")}
          onChange={handleFileInputChange}
          style={{ display: "none" }}
          id="file-input"
          aria-describedby="file-input-description"
        />
        <label
          htmlFor="file-input"
          style={{ cursor: "pointer", display: "block" }}
        >
          <CloudUpload sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Drag and drop files here or click to select
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            id="file-input-description"
          >
            Supported formats: Images, PDFs, Documents • Max size: 5MB
          </Typography>
        </label>
      </Paper>

      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">
              Selected Files ({files.length})
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleUploadAll}
                disabled={isUploading || pendingCount === 0}
                startIcon={<CloudUpload />}
                aria-label={`Upload ${pendingCount} files`}
              >
                Upload All ({pendingCount})
              </Button>
              <Button
                variant="outlined"
                onClick={clearAll}
                disabled={isUploading}
                aria-label="Clear all files"
              >
                Clear All
              </Button>
            </Box>
          </Box>

          <List role="list" aria-label="File upload list">
            {files.map((fileWithStatus, index) => (
              <ListItem
                key={index}
                divider
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemIcon>
                  {getStatusIcon(fileWithStatus.status)}
                </ListItemIcon>
                <ListItemText
                  primary={fileWithStatus.file.name}
                  secondary={
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mt: 1,
                      }}
                    >
                      <Typography variant="body2">
                        {formatFileSize(fileWithStatus.file.size)}
                      </Typography>
                      <Chip
                        label={fileWithStatus.status}
                        size="small"
                        color={
                          getStatusColor(fileWithStatus.status) as
                            | "default"
                            | "primary"
                            | "secondary"
                            | "error"
                            | "info"
                            | "success"
                            | "warning"
                        }
                        variant="outlined"
                      />
                      {fileWithStatus.error && (
                        <Typography variant="body2" color="error">
                          {fileWithStatus.error}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <Button
                  size="small"
                  onClick={() => removeFile(index)}
                  disabled={fileWithStatus.status === "uploading"}
                  aria-label={`Remove ${fileWithStatus.file.name}`}
                >
                  Remove
                </Button>
              </ListItem>
            ))}
          </List>

          {successCount > 0 && (
            <Alert
              severity="success"
              sx={{ mt: 2 }}
              role="status"
              aria-live="polite"
            >
              {successCount} file(s) uploaded successfully!
            </Alert>
          )}

          {errorCount > 0 && (
            <Alert
              severity="error"
              sx={{ mt: 2 }}
              role="alert"
              aria-live="polite"
            >
              {errorCount} file(s) failed to upload. Please check the errors
              above.
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
