import React, { useState } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Popover,
  Typography,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  SignalWifi4Bar as ExcellentIcon,
  SignalWifi3Bar as GoodIcon,
  SignalWifi2Bar as FairIcon,
  SignalWifi1Bar as PoorIcon,
  CloudQueue as QueueIcon,
  CloudSync as SyncIcon,
  CloudDone as SyncedIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useNetwork } from '../../contexts/NetworkContext';

interface NetworkStatusIndicatorProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showDetails?: boolean;
  compact?: boolean;
}

const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  position = 'top-right',
  showDetails = true,
  compact = false
}) => {
  const {
    isOnline,
    isSlowConnection,
    connectionQuality,
    networkStatus,
    queuedRequests,
    isProcessingQueue,
    processQueue,
    clearQueue,
    getNetworkAdvice
  } = useNetwork();

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Get appropriate icon for connection quality
  const getQualityIcon = () => {
    switch (connectionQuality) {
      case 'excellent': return <ExcellentIcon />;
      case 'good': return <GoodIcon />;
      case 'fair': return <FairIcon />;
      case 'poor': return <PoorIcon />;
      case 'offline': return <WifiOffIcon />;
      default: return <WifiIcon />;
    }
  };

  // Get color for connection quality
  const getQualityColor = (): 'success' | 'warning' | 'error' | 'default' => {
    switch (connectionQuality) {
      case 'excellent':
      case 'good': return 'success';
      case 'fair': return 'warning';
      case 'poor':
      case 'offline': return 'error';
      default: return 'default';
    }
  };

  // Get status text
  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSlowConnection) return 'Slow';
    return connectionQuality.charAt(0).toUpperCase() + connectionQuality.slice(1);
  };

  // Position styles
  const getPositionStyles = () => {
    const base = {
      position: 'fixed' as const,
      zIndex: 1300,
      m: 2
    };

    switch (position) {
      case 'top-right': return { ...base, top: 0, right: 0 };
      case 'top-left': return { ...base, top: 0, left: 0 };
      case 'bottom-right': return { ...base, bottom: 0, right: 0 };
      case 'bottom-left': return { ...base, bottom: 0, left: 0 };
      default: return { ...base, top: 0, right: 0 };
    }
  };

  if (compact) {
    return (
      <Tooltip title={getNetworkAdvice()}>
        <Chip
          icon={getQualityIcon()}
          label={getStatusText()}
          color={getQualityColor()}
          size="small"
          variant={isOnline ? 'filled' : 'outlined'}
          sx={getPositionStyles()}
        />
      </Tooltip>
    );
  }

  return (
    <>
      <Box sx={getPositionStyles()}>
        <Tooltip title="Network Status">
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': {
                bgcolor: 'background.paper',
                boxShadow: 4
              }
            }}
          >
            {getQualityIcon()}
            {queuedRequests.length > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  bgcolor: 'warning.main',
                  color: 'warning.contrastText',
                  borderRadius: '50%',
                  width: 16,
                  height: 16,
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {queuedRequests.length}
              </Box>
            )}
          </IconButton>
        </Tooltip>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, minWidth: 300, maxWidth: 400 }}>
          {/* Network Status Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            {getQualityIcon()}
            <Typography variant="h6">
              Network Status
            </Typography>
            <Chip
              label={getStatusText()}
              color={getQualityColor()}
              size="small"
            />
          </Box>

          {/* Network Advice */}
          <Alert 
            severity={isOnline ? 'info' : 'warning'} 
            icon={<InfoIcon />}
            sx={{ mb: 2 }}
          >
            {getNetworkAdvice()}
          </Alert>

          {/* Detailed Network Info */}
          {showDetails && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Connection Details:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Status"
                    secondary={isOnline ? 'Online' : 'Offline'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Quality"
                    secondary={connectionQuality}
                  />
                </ListItem>
                {networkStatus.effectiveType !== 'unknown' && (
                  <ListItem>
                    <ListItemText
                      primary="Connection Type"
                      secondary={networkStatus.effectiveType.toUpperCase()}
                    />
                  </ListItem>
                )}
                {networkStatus.downlink > 0 && (
                  <ListItem>
                    <ListItemText
                      primary="Download Speed"
                      secondary={`${networkStatus.downlink} Mbps`}
                    />
                  </ListItem>
                )}
                {networkStatus.rtt > 0 && (
                  <ListItem>
                    <ListItemText
                      primary="Latency"
                      secondary={`${networkStatus.rtt} ms`}
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}

          {/* Offline Queue Status */}
          {queuedRequests.length > 0 && (
            <>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <QueueIcon />
                  <Typography variant="subtitle2">
                    Offline Queue ({queuedRequests.length})
                  </Typography>
                </Box>

                {isProcessingQueue && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Syncing queued requests...
                    </Typography>
                    <LinearProgress />
                  </Box>
                )}

                <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
                  {queuedRequests.slice(0, 5).map((request) => (
                    <ListItem key={request.id}>
                      <ListItemIcon>
                        {request.retryCount > 0 ? <RefreshIcon /> : <CloudQueue />}
                      </ListItemIcon>
                      <ListItemText
                        primary={`${request.method} ${request.url.split('/').pop()}`}
                        secondary={
                          request.retryCount > 0 
                            ? `Retried ${request.retryCount} times`
                            : new Date(request.timestamp).toLocaleTimeString()
                        }
                      />
                    </ListItem>
                  ))}
                  {queuedRequests.length > 5 && (
                    <ListItem>
                      <ListItemText
                        primary={`... and ${queuedRequests.length - 5} more`}
                        sx={{ fontStyle: 'italic' }}
                      />
                    </ListItem>
                  )}
                </List>

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button
                    size="small"
                    startIcon={<SyncIcon />}
                    onClick={processQueue}
                    disabled={!isOnline || isProcessingQueue}
                    variant="outlined"
                  >
                    Sync Now
                  </Button>
                  <Button
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={clearQueue}
                    disabled={isProcessingQueue}
                    color="error"
                    variant="outlined"
                  >
                    Clear
                  </Button>
                </Box>
              </Box>
            </>
          )}

          {/* Success Message */}
          {isOnline && queuedRequests.length === 0 && (
            <Alert severity="success" icon={<SyncedIcon />}>
              All data is synced
            </Alert>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NetworkStatusIndicator; 