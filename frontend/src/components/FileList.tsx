import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Download,
  Delete,
  Refresh,
  InsertDriveFile,
  Image,
  PictureAsPdf,
  Description,
} from "@mui/icons-material";
import filesService, { File } from "../services/files.service";

interface FileListProps {
  refreshTrigger: number;
  onRefresh: () => void;
}

const FileList: React.FC<FileListProps> = ({ refreshTrigger, onRefresh }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(
    new Set()
  );
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError("");
      const fileList = await filesService.getFiles();
      setFiles(fileList.files);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [refreshTrigger]);

  const handleDownload = async (file: File) => {
    try {
      setDownloadingFiles((prev) => new Set([...prev, file.id]));
      const downloadUrl = await filesService.downloadFile(file.id);

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to download file");
    } finally {
      setDownloadingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const handleDelete = async (file: File) => {
    if (
      !window.confirm(`Are you sure you want to delete "${file.filename}"?`)
    ) {
      return;
    }

    try {
      setDeletingFiles((prev) => new Set([...prev, file.id]));
      await filesService.deleteFile(file.id);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to delete file");
    } finally {
      setDeletingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const getFileIcon = (filetype: string) => {
    if (filetype.startsWith("image/")) {
      return <Image color="primary" />;
    }
    if (filetype === "application/pdf") {
      return <PictureAsPdf color="error" />;
    }
    if (filetype.includes("word") || filetype === "text/plain") {
      return <Description color="info" />;
    }
    return <InsertDriveFile />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileTypeChip = (filetype: string) => {
    if (filetype.startsWith("image/")) {
      return <Chip label="Image" color="primary" size="small" />;
    }
    if (filetype === "application/pdf") {
      return <Chip label="PDF" color="error" size="small" />;
    }
    if (filetype.includes("word")) {
      return <Chip label="Word" color="info" size="small" />;
    }
    if (filetype === "text/plain") {
      return <Chip label="Text" color="success" size="small" />;
    }
    return <Chip label="Document" color="default" size="small" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 4,
        }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading files...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" component="h2">
          My Files ({files.length})
        </Typography>
        <Tooltip title="Refresh file list">
          <IconButton
            onClick={onRefresh}
            aria-label="Refresh file list"
            disabled={loading}
          >
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert" aria-live="polite">
          {error}
        </Alert>
      )}

      {files.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No files uploaded yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload your first file to get started
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 2,
          }}
        >
          {files.map((file) => (
            <Box key={file.id}>
              <Card
                elevation={2}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "&:hover": {
                    elevation: 4,
                    transform: "translateY(-2px)",
                    transition: "all 0.2s ease-in-out",
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    {getFileIcon(file.filetype)}
                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{
                        ml: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flexGrow: 1,
                      }}
                      title={file.filename}
                    >
                      {file.filename}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    {getFileTypeChip(file.filetype)}
                    <Typography variant="body2" color="text.secondary">
                      {formatFileSize(file.size)}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Uploaded: {formatDate(file.createdAt)}
                  </Typography>
                </CardContent>

                <CardActions sx={{ justifyContent: "space-between" }}>
                  <Button
                    variant="contained"
                    startIcon={
                      downloadingFiles.has(file.id) ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Download />
                      )
                    }
                    onClick={() => handleDownload(file)}
                    disabled={downloadingFiles.has(file.id)}
                    size="small"
                    aria-label={`Download ${file.filename}`}
                  >
                    {downloadingFiles.has(file.id)
                      ? "Downloading..."
                      : "Download"}
                  </Button>

                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={
                      deletingFiles.has(file.id) ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Delete />
                      )
                    }
                    onClick={() => handleDelete(file)}
                    disabled={deletingFiles.has(file.id)}
                    size="small"
                    aria-label={`Delete ${file.filename}`}
                  >
                    {deletingFiles.has(file.id) ? "Deleting..." : "Delete"}
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default FileList;
