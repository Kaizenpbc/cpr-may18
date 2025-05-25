import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Grid } from '@mui/material';
import ErrorBoundary from './ErrorBoundary';

// Demo components that throw different types of errors
const NetworkErrorComponent = () => {
  throw new Error('Network Error: Failed to fetch data from server');
};

const ChunkErrorComponent = () => {
  throw new Error('ChunkLoadError: Loading chunk 2 failed');
};

const AuthErrorComponent = () => {
  throw new Error('Authentication failed: Invalid token provided');
};

const RuntimeErrorComponent = () => {
  const obj: any = null;
  return <div>{obj.property.value}</div>; // Will throw "Cannot read property"
};

const ValidationErrorComponent = () => {
  throw new Error('Validation error: Required field is missing');
};

interface ErrorTestProps {
  errorType: string;
  onTrigger: () => void;
}

const ErrorTest: React.FC<ErrorTestProps> = ({ errorType, onTrigger }) => {
  const [shouldError, setShouldError] = useState(false);

  const handleTrigger = () => {
    setShouldError(true);
    onTrigger();
  };

  if (shouldError) {
    switch (errorType) {
      case 'network': return <NetworkErrorComponent />;
      case 'chunk': return <ChunkErrorComponent />;
      case 'auth': return <AuthErrorComponent />;
      case 'runtime': return <RuntimeErrorComponent />;
      case 'validation': return <ValidationErrorComponent />;
      default: return <div>Unknown error type</div>;
    }
  }

  return (
    <Button 
      variant="outlined" 
      color="error" 
      onClick={handleTrigger}
      fullWidth
    >
      Trigger {errorType} Error
    </Button>
  );
};

const ErrorBoundaryDemo: React.FC = () => {
  const errorTypes = [
    { type: 'network', label: 'Network Error' },
    { type: 'chunk', label: 'Chunk Loading Error' },
    { type: 'auth', label: 'Authentication Error' },
    { type: 'runtime', label: 'Runtime Error' },
    { type: 'validation', label: 'Validation Error' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Enhanced Error Boundary Demo
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        Test the enhanced error boundary with different error types. 
        Each error will be categorized and handled appropriately.
      </Typography>

      <Grid container spacing={2}>
        {errorTypes.map(({ type, label }) => (
          <Grid item xs={12} sm={6} md={4} key={type}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                {label}
              </Typography>
              <ErrorBoundary 
                context={`demo_${type}`}
                showDetails={true}
              >
                <ErrorTest 
                  errorType={type}
                  onTrigger={() => console.log(`Triggering ${type} error`)}
                />
              </ErrorBoundary>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ErrorBoundaryDemo; 