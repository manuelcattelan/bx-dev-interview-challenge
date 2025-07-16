import React from "react";
import { useNavigate } from "react-router-dom";
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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate("/sign-in");
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="sticky">
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
          <FileUpload />
          <Divider sx={{ my: 4 }} />
          <FileList />
        </Paper>
      </Container>
    </Box>
  );
};

export default Dashboard;
