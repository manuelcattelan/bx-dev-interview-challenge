import React from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Button,
  Container,
  Paper,
  Divider,
} from "@mui/material";
import { Logout } from "@mui/icons-material";
import authService from "../services/auth";
import FileUpload from "./FileUpload";
import FileList from "./FileList";
import { useFileList } from "../hooks/useFileList";

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const { userFiles, userFilesError, getUserFiles, isLoading } = useFileList();

  const handleFileUploadSuccess = () => {
    getUserFiles();
  };

  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<Logout />}
            aria-label="Logout from your account"
            sx={{ marginLeft: "auto" }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <FileUpload onUploadSuccess={handleFileUploadSuccess} />
          <Divider sx={{ my: 4 }} />
          <FileList
            userFiles={userFiles}
            userFilesError={userFilesError}
            isLoading={isLoading}
            refreshUserFiles={getUserFiles}
          />
        </Paper>
      </Container>
    </Box>
  );
};

export default Dashboard;
