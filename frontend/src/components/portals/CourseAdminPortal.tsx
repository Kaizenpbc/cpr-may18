import React from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
} from '@mui/material';
import { LogoutOutlined as LogoutIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import InstructorManagement from './courseAdmin/InstructorManagement';

const CourseAdminPortal: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (user?.role !== 'admin') {
    return (
      <Container>
        <Typography variant="h5" color="error" align="center" sx={{ mt: 4 }}>
          Access Denied: You must be a course administrator to view this page.
        </Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
            🎓 Course Administration Portal
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Welcome {user?.username || 'Admin'}!
          </Typography>
          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Paper sx={{ p: 2 }}>
          <Typography component="h1" variant="h4" color="primary" gutterBottom>
            Course Administration
          </Typography>
          
          <InstructorManagement />
        </Paper>
      </Container>
    </Box>
  );
};

export default CourseAdminPortal; 