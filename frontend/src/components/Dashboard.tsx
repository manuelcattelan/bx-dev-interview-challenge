import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { Logout, CloudUpload, List } from '@mui/icons-material';
import authService from '../services/auth.service';
import FileUpload from './FileUpload';
import FileList from './FileList';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [refreshFileList, setRefreshFileList] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleFileUploadSuccess = () => {
    setRefreshFileList(prev => prev + 1);
    setCurrentTab(1); // Switch to file list tab
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
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="File management tabs"
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            <Tab
              icon={<CloudUpload />}
              label="Upload Files"
              id="upload-tab"
              aria-controls="upload-panel"
            />
            <Tab
              icon={<List />}
              label="My Files"
              id="files-tab"
              aria-controls="files-panel"
            />
          </Tabs>

          <Box
            role="tabpanel"
            hidden={currentTab !== 0}
            id="upload-panel"
            aria-labelledby="upload-tab"
          >
            {currentTab === 0 && (
              <FileUpload onUploadSuccess={handleFileUploadSuccess} />
            )}
          </Box>

          <Box
            role="tabpanel"
            hidden={currentTab !== 1}
            id="files-panel"
            aria-labelledby="files-tab"
          >
            {currentTab === 1 && (
              <FileList 
                refreshTrigger={refreshFileList}
                onRefresh={() => setRefreshFileList(prev => prev + 1)}
              />
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Dashboard; 
