import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Download, Delete, Refresh } from "@mui/icons-material";
import filesService, { File } from "../services/files";
import ActionButton from "./shared/ActionButton";
import { useToast } from "../hooks/useToast";
import { getErrorMessage } from "../utils/errors";
import { useFileList } from "../hooks/useFileList";

const FileList: React.FC = () => {
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(
    new Set()
  );
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());

  const { showSuccessNotification, showErrorNotification } = useToast();
  const { userFiles, userFilesError, getUserFiles, isLoading } = useFileList();

  const handleFileDownload = async (file: File) => {
    try {
      setDownloadingFiles((prev) => new Set([...prev, file.id]));

      const blob = await filesService.downloadFile(file.id);
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = file.filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
      showSuccessNotification(`${file.filename} downloaded successfully!`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showErrorNotification(
        `Failed to download ${file.filename}: ${errorMessage}`
      );
    } finally {
      setDownloadingFiles((currentDownloadingFiles) => {
        const newDownloadingFiles = new Set(currentDownloadingFiles);
        newDownloadingFiles.delete(file.id);

        return newDownloadingFiles;
      });
    }
  };

  const handleFileDelete = async (file: File) => {
    if (!window.confirm(`Are you sure you want to delete ${file.filename}?`)) {
      return;
    }

    try {
      setDeletingFiles(
        (currentDeletingFiles) => new Set([...currentDeletingFiles, file.id])
      );

      await filesService.deleteFile(file.id);
      showSuccessNotification(`${file.filename} deleted successfully!`);
      getUserFiles();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showErrorNotification(
        `Failed to delete ${file.filename}: ${errorMessage}`
      );
    } finally {
      setDeletingFiles((currentDeletingFiles) => {
        const newDeletingFiles = new Set(currentDeletingFiles);
        newDeletingFiles.delete(file.id);

        return newDeletingFiles;
      });
    }
  };

  const formatUploadedAtDate = (uploadedAtDate: string) => {
    return new Date(uploadedAtDate).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileType = (filetype: string) => {
    if (filetype.startsWith("image/")) {
      return "Image";
    }
    return "Document";
  };

  const formatFileSize = (filesize: number): string => {
    if (filesize === 0) return "0 Bytes";

    const base = 1024;
    const exponent = Math.floor(Math.log(filesize) / Math.log(base));
    const units = ["Bytes", "KB", "MB", "GB"];

    return (
      parseFloat((filesize / Math.pow(base, exponent)).toFixed(2)) +
      " " +
      units[exponent]
    );
  };

  useEffect(() => {
    if (userFilesError) {
      showErrorNotification(userFilesError);
    }
  }, [userFilesError, showErrorNotification]);

  if (isLoading) {
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
          My Files ({userFiles.length})
        </Typography>
        <Tooltip title="Refresh file list">
          <IconButton
            onClick={getUserFiles}
            aria-label="Refresh file list"
            disabled={
              isLoading || downloadingFiles.size > 0 || deletingFiles.size > 0
            }
          >
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {userFiles.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No files uploaded yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload your first file to get started
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="files table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userFiles.map((file) => (
                <TableRow
                  key={file.id}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{
                      maxWidth: 200,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={file.filename}
                  >
                    {file.filename}
                  </TableCell>
                  <TableCell>{formatFileType(file.filetype)}</TableCell>
                  <TableCell>{formatFileSize(file.size)}</TableCell>
                  <TableCell>{formatUploadedAtDate(file.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1,
                      }}
                    >
                      <ActionButton
                        onClick={() => handleFileDownload(file)}
                        disabled={
                          downloadingFiles.has(file.id) ||
                          deletingFiles.has(file.id)
                        }
                        isLoading={downloadingFiles.has(file.id)}
                        loadingText="Downloading..."
                        defaultText="Download"
                        icon={<Download />}
                        ariaLabel={`Download ${file.filename}`}
                        variant="contained"
                      />

                      <ActionButton
                        onClick={() => handleFileDelete(file)}
                        disabled={
                          deletingFiles.has(file.id) ||
                          downloadingFiles.has(file.id)
                        }
                        isLoading={deletingFiles.has(file.id)}
                        loadingText="Deleting..."
                        defaultText="Delete"
                        icon={<Delete />}
                        ariaLabel={`Delete ${file.filename}`}
                        variant="outlined"
                        color="error"
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default FileList;
