import React, { useEffect } from 'react';
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Alert } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ErrorLogger from '../services/errorLogger';

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Log the error
    ErrorLogger.logRouteError(error, {
      path: window.location.pathname,
      timestamp: new Date().toISOString()
    });
  }, [error]);

  let heading = 'Oops! Something went wrong';
  let message = 'An unexpected error occurred. Please try again later.';
  let severity = 'error';
  let icon = <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main' }} />;
  let actions = [
    <Button
      key="home"
      variant="contained"
      color="primary"
      onClick={() => navigate('/')}
    >
      Return to Home
    </Button>
  ];

  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 404:
        heading = '404 - Page Not Found';
        message = 'The page you are looking for does not exist.';
        severity = 'warning';
        icon = <ErrorOutlineIcon sx={{ fontSize: 64, color: 'warning.main' }} />;
        actions = [
          <Button
            key="home"
            variant="contained"
            color="primary"
            onClick={() => navigate('/')}
          >
            Go to Home
          </Button>,
          <Button
            key="back"
            variant="outlined"
            color="primary"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        ];
        break;
      case 401:
        heading = 'Unauthorized Access';
        message = 'Please log in to access this page.';
        severity = 'info';
        icon = <ErrorOutlineIcon sx={{ fontSize: 64, color: 'info.main' }} />;
        actions = [
          <Button
            key="login"
            variant="contained"
            color="primary"
            onClick={() => navigate('/login')}
          >
            Log In
          </Button>
        ];
        break;
      case 403:
        heading = 'Access Denied';
        message = 'You do not have permission to access this page.';
        severity = 'error';
        icon = <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main' }} />;
        actions = [
          <Button
            key="home"
            variant="contained"
            color="primary"
            onClick={() => navigate('/')}
          >
            Return to Home
          </Button>,
          <Button
            key="contact"
            variant="outlined"
            color="primary"
            onClick={() => navigate('/contact')}
          >
            Contact Support
          </Button>
        ];
        break;
      case 500:
        heading = 'Server Error';
        message = 'The server encountered an error. Please try again later.';
        severity = 'error';
        icon = <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main' }} />;
        break;
      case 503:
        heading = 'Service Unavailable';
        message = 'The service is temporarily unavailable. Please try again later.';
        severity = 'warning';
        icon = <ErrorOutlineIcon sx={{ fontSize: 64, color: 'warning.main' }} />;
        break;
      default:
        heading = `Error ${error.status}`;
        message = error.statusText || 'An unexpected error occurred.';
    }
  } else if (error instanceof Error) {
    message = error.message;
    if (error.name === 'NetworkError') {
      heading = 'Network Error';
      message = 'Unable to connect to the server. Please check your internet connection.';
      severity = 'warning';
      icon = <ErrorOutlineIcon sx={{ fontSize: 64, color: 'warning.main' }} />;
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
          gap: 3
        }}
      >
        {icon}
        <Typography variant="h4" component="h1" gutterBottom>
          {heading}
        </Typography>
        <Alert severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {actions}
        </Box>
        {process.env.NODE_ENV === 'development' && error instanceof Error && (
          <Box
            sx={{
              mt: 4,
              p: 2,
              bgcolor: 'grey.100',
              borderRadius: 1,
              width: '100%',
              overflow: 'auto'
            }}
          >
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {error.stack}
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
} 