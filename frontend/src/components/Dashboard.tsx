import React, { useState } from "react";
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
import authService from "../services/auth.service";
import FileUpload from "./FileUpload";
import FileList from "./FileList";

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [refreshFileList, setRefreshFileList] = useState(0);

  const handleFileUploadSuccess = () => {
    setRefreshFileList((prev) => prev + 1);
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
            refreshTrigger={refreshFileList}
            onRefresh={() => setRefreshFileList((prev) => prev + 1)}
          />
        </Paper>
      </Container>
    </Box>
  );
};

export default Dashboard;
