import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as LoadingIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useToast, ToastType, ToastPriority, ToastPosition } from '../../contexts/ToastContext';
import ToastContainer from './ToastContainer';

const ToastDemo: React.FC = () => {
  const {
    toasts,
    success,
    error,
    warning,
    info,
    loading,
    showToast,
    dismissAll,
    updateToast,
    setPosition,
    setMaxToasts,
    setDefaultDuration,
    position,
    maxToasts,
    defaultDuration,
    getToastsByType,
    getToastsByPriority
  } = useToast();

  // Demo state
  const [customMessage, setCustomMessage] = useState('This is a custom toast message');
  const [customTitle, setCustomTitle] = useState('');
  const [customType, setCustomType] = useState<ToastType>('info');
  const [customPriority, setCustomPriority] = useState<ToastPriority>('normal');
  const [customDuration, setCustomDuration] = useState(5000);
  const [customDismissible, setCustomDismissible] = useState(true);
  const [customShowProgress, setCustomShowProgress] = useState(true);
  const [loadingToastId, setLoadingToastId] = useState<string | null>(null);

  // Quick toast examples
  const showSuccessToast = () => {
    success('Operation completed successfully!', {
      title: 'Success',
      context: 'demo_success'
    });
  };

  const showErrorToast = () => {
    error('Something went wrong. Please try again.', {
      title: 'Error',
      context: 'demo_error',
      actions: [
        {
          label: 'Retry',
          onClick: () => {
            success('Retrying operation...');
          },
          color: 'primary'
        },
        {
          label: 'Report',
          onClick: () => {
            info('Error reported to support team');
          },
          color: 'secondary'
        }
      ]
    });
  };

  const showWarningToast = () => {
    warning('Your session will expire in 5 minutes', {
      title: 'Session Warning',
      context: 'demo_warning',
      actions: [
        {
          label: 'Extend Session',
          onClick: () => {
            success('Session extended for 30 minutes');
          },
          color: 'primary',
          variant: 'contained'
        }
      ]
    });
  };

  const showInfoToast = () => {
    info('New features are available in this update', {
      title: 'What\'s New',
      context: 'demo_info',
      actions: [
        {
          label: 'Learn More',
          onClick: () => {
            info('Opening feature guide...');
          },
          color: 'primary'
        }
      ]
    });
  };

  const showLoadingToast = () => {
    const id = loading('Processing your request...', {
      title: 'Please Wait',
      context: 'demo_loading'
    });
    setLoadingToastId(id);

    // Simulate completion after 3 seconds
    setTimeout(() => {
      updateToast(id, {
        type: 'success',
        message: 'Request processed successfully!',
        duration: 4000,
        dismissible: true,
        showProgress: true
      });
      setLoadingToastId(null);
    }, 3000);
  };

  const showCriticalToast = () => {
    showToast({
      type: 'error',
      priority: 'critical',
      title: 'Critical System Alert',
      message: 'Database connection lost. Attempting to reconnect...',
      duration: 0, // Persistent
      context: 'demo_critical',
      actions: [
        {
          label: 'Retry Connection',
          onClick: () => {
            success('Reconnection successful');
          },
          color: 'error',
          variant: 'contained'
        },
        {
          label: 'Contact Support',
          onClick: () => {
            info('Support ticket created');
          },
          color: 'secondary'
        }
      ]
    });
  };

  const showCustomToast = () => {
    showToast({
      type: customType,
      priority: customPriority,
      title: customTitle || undefined,
      message: customMessage,
      duration: customDuration,
      dismissible: customDismissible,
      showProgress: customShowProgress,
      context: 'demo_custom'
    });
  };

  const getTypeIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <SuccessIcon color="success" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'loading': return <LoadingIcon color="action" />;
      case 'info':
      default: return <InfoIcon color="info" />;
    }
  };

  const getPriorityColor = (priority: ToastPriority) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'primary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Toast Container */}
      <ToastContainer />

      <Typography variant="h4" gutterBottom>
        Toast Notification System Demo
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        Test the comprehensive toast notification system with different types, priorities, actions, and configurations.
      </Typography>

      <Grid container spacing={3}>
        {/* Quick Examples */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Examples
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={<SuccessIcon />}
                  onClick={showSuccessToast}
                >
                  Success Toast
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  startIcon={<ErrorIcon />}
                  onClick={showErrorToast}
                >
                  Error Toast
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="warning"
                  startIcon={<WarningIcon />}
                  onClick={showWarningToast}
                >
                  Warning Toast
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="info"
                  startIcon={<InfoIcon />}
                  onClick={showInfoToast}
                >
                  Info Toast
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<LoadingIcon />}
                  onClick={showLoadingToast}
                  disabled={!!loadingToastId}
                >
                  Loading Toast
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  onClick={showCriticalToast}
                >
                  Critical Alert
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Current Toasts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Active Toasts ({toasts.length})
              </Typography>
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={dismissAll}
                disabled={toasts.length === 0}
                color="error"
              >
                Clear All
              </Button>
            </Box>

            {toasts.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No active toasts
              </Typography>
            ) : (
              <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                {toasts.map((toast) => (
                  <ListItem key={toast.id}>
                    <ListItemIcon>
                      {getTypeIcon(toast.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={toast.title || toast.message}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={toast.type}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={toast.priority}
                            size="small"
                            color={getPriorityColor(toast.priority)}
                            variant="outlined"
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Custom Toast Builder */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Custom Toast Builder
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Title (Optional)"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as ToastType)}
                  >
                    <MenuItem value="success">Success</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                    <MenuItem value="warning">Warning</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
                    <MenuItem value="loading">Loading</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={customPriority}
                    onChange={(e) => setCustomPriority(e.target.value as ToastPriority)}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Duration (ms)"
                  type="number"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  helperText="0 = persistent"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={customDismissible}
                        onChange={(e) => setCustomDismissible(e.target.checked)}
                      />
                    }
                    label="Dismissible"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={customShowProgress}
                        onChange={(e) => setCustomShowProgress(e.target.checked)}
                      />
                    }
                    label="Show Progress"
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={showCustomToast}
                  startIcon={<NotificationIcon />}
                >
                  Show Custom Toast
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Configuration */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Global Configuration
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Position</InputLabel>
                  <Select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as ToastPosition)}
                  >
                    <MenuItem value="top-left">Top Left</MenuItem>
                    <MenuItem value="top-center">Top Center</MenuItem>
                    <MenuItem value="top-right">Top Right</MenuItem>
                    <MenuItem value="bottom-left">Bottom Left</MenuItem>
                    <MenuItem value="bottom-center">Bottom Center</MenuItem>
                    <MenuItem value="bottom-right">Bottom Right</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Max Toasts"
                  type="number"
                  value={maxToasts}
                  onChange={(e) => setMaxToasts(Number(e.target.value))}
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Default Duration (ms)"
                  type="number"
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(Number(e.target.value))}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Statistics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Toast Statistics
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {getToastsByType('success').length}
                  </Typography>
                  <Typography variant="caption">Success</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">
                    {getToastsByType('error').length}
                  </Typography>
                  <Typography variant="caption">Error</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {getToastsByType('warning').length}
                  </Typography>
                  <Typography variant="caption">Warning</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {getToastsByType('info').length}
                  </Typography>
                  <Typography variant="caption">Info</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="action.active">
                    {getToastsByType('loading').length}
                  </Typography>
                  <Typography variant="caption">Loading</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">
                    {getToastsByPriority('critical').length}
                  </Typography>
                  <Typography variant="caption">Critical</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ToastDemo; 