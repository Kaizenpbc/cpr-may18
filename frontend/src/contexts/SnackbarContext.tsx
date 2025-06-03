import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface SnackbarContextType {
  showSuccess: (message: string) => void;
  showError: (message: string | any) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(
  undefined
);

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showSnackbar = useCallback(
    (message: string | any, severity: AlertColor) => {
      // Handle different message formats
      let displayMessage = '';

      if (typeof message === 'string') {
        displayMessage = message;
      } else if (message && typeof message === 'object') {
        // Handle error object format
        if (message.message) {
          displayMessage = message.message;
        } else if (message.error) {
          displayMessage = message.error;
        } else {
          // Fallback to stringifying the object
          displayMessage = JSON.stringify(message);
        }
      } else {
        displayMessage = 'An error occurred';
      }

      setSnackbar({
        open: true,
        message: displayMessage,
        severity,
      });
    },
    []
  );

  const showSuccess = useCallback(
    (message: string) => {
      showSnackbar(message, 'success');
    },
    [showSnackbar]
  );

  const showError = useCallback(
    (message: string | any) => {
      showSnackbar(message, 'error');
    },
    [showSnackbar]
  );

  const showWarning = useCallback(
    (message: string) => {
      showSnackbar(message, 'warning');
    },
    [showSnackbar]
  );

  const showInfo = useCallback(
    (message: string) => {
      showSnackbar(message, 'info');
    },
    [showSnackbar]
  );

  const handleClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <SnackbarContext.Provider
      value={{ showSuccess, showError, showWarning, showInfo }}
    >
      {children}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          variant='filled'
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export default SnackbarContext;
