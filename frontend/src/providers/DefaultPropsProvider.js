import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const defaultTheme = createTheme({
  components: {
    MuiButton: {
      defaultProps: {
        variant: 'contained',
        color: 'primary',
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 1,
      },
    },
  },
});

const DefaultPropsProvider = ({ children }) => {
  return (
    <ThemeProvider theme={defaultTheme}>
      {children}
    </ThemeProvider>
  );
};

export default DefaultPropsProvider; 