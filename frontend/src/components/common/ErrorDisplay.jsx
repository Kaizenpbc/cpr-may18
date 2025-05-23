import React from 'react';
import { Alert, Snackbar, CircularProgress, Box } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';

const ErrorDisplay = () => {
  const { error, backendStatus } = useAuth();

  // Don't show anything if there's no error and backend is healthy
  if (!error && backendStatus === 'healthy') {
    return null;
  }

  // Show loading state while checking backend
  if (backendStatus === 'checking') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  // Determine severity based on error type
  const getSeverity = () => {
    if (backendStatus === 'unhealthy') return 'error';
    if (error?.type === 'connection') return 'error';
    if (error?.type === 'auth') return 'warning';
    return 'info';
  };

  // Get appropriate message
  const getMessage = () => {
    if (backendStatus === 'unhealthy') {
      return 'Backend server is not responding. Please try again later.';
    }
    if (error?.type === 'connection') {
      return 'Unable to connect to the server. Please check your connection.';
    }
    if (error?.type === 'auth') {
      return 'Authentication failed. Please log in again.';
    }
    return error?.message || 'An unexpected error occurred.';
  };

  // Get appropriate action
  const getAction = () => {
    if (backendStatus === 'unhealthy' || error?.type === 'connection') {
      return 'Retrying connection...';
    }
    return null;
  };

  logger.debug('ErrorDisplay rendering:', { error, backendStatus });

  return (
    <Snackbar
      open={true}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ mt: 8 }} // Add margin top to avoid overlapping with app bar
    >
      <Alert
        severity={getSeverity()}
        action={getAction()}
        sx={{ width: '100%' }}
      >
        {getMessage()}
      </Alert>
    </Snackbar>
  );
};

export default ErrorDisplay; 