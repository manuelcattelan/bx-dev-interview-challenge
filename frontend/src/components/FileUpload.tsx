import React, { useState, useCallback } from "react";
import { Box, Typography, Paper, LinearProgress } from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import filesService from "../services/files";
import { useToast } from "../hooks/useToast";
import { getErrorMessage } from "../utils/errors";
import { ALLOWED_FILE_TYPES, ALLOWED_FILE_SIZE } from "../common/constants";
import { useFileList } from "../hooks/useFileList";

const FileUpload: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const { showSuccessNotification, showErrorNotification } = useToast();
  const { getUserFiles } = useFileList();

  const validateFile = (file: File): string | null => {
    if (!(ALLOWED_FILE_TYPES as readonly string[]).includes(file.type)) {
      return "File type not allowed. Please upload images, PDFs, or documents.";
    }

    if (file.size > ALLOWED_FILE_SIZE) {
      return `File size exceeds ${ALLOWED_FILE_SIZE / 1024 / 1024}MB limit.`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    setIsUploadingFile(true);

    try {
      await filesService.uploadFile(file);

      showSuccessNotification(`${file.name} uploaded successfully!`);

      getUserFiles();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showErrorNotification(errorMessage);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleFileInputSelected = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        showErrorNotification(error);
        return;
      }

      uploadFile(file);
    },
    [showErrorNotification]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileInputSelected(e.dataTransfer.files[0]);
      }
    },
    [handleFileInputSelected, showErrorNotification]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileInputSelected(e.target.files[0]);
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
          borderColor: isDragging ? "primary.main" : "grey.300",
          backgroundColor: isDragging ? "action.hover" : "transparent",
          textAlign: "center",
          cursor: isUploadingFile ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          "&:hover": {
            borderColor: isUploadingFile ? "grey.300" : "primary.main",
            backgroundColor: isUploadingFile ? "transparent" : "action.hover",
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
          accept={ALLOWED_FILE_TYPES.join(",")}
          onChange={handleFileInputChange}
          style={{ display: "none" }}
          id="file-input"
          aria-describedby="file-input-description"
          disabled={isUploadingFile}
        />
        <label
          htmlFor="file-input"
          style={{
            display: "block",
            cursor: isUploadingFile ? "not-allowed" : "pointer",
            pointerEvents: isUploadingFile ? "none" : "auto",
          }}
        >
          <CloudUpload sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isUploadingFile
              ? "Uploading..."
              : "Drag and drop a file here or click to select"}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            id="file-input-description"
          >
            {isUploadingFile
              ? "Please wait while your file is being uploaded"
              : "Supported formats: Images, PDFs, Documents • Max size: 5MB"}
          </Typography>
        </label>

        {isUploadingFile && (
          <LinearProgress
            sx={{
              borderRadius: "0 0 4px 4px",
              position: "absolute",
              bottom: 0,
              right: 0,
            }}
          />
        )}
      </Paper>
    </Box>
  );
};

export default FileUpload;
