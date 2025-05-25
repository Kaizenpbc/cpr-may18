import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  TextField
} from '@mui/material';
import {
  CloudQueue as QueueIcon,
  Send as SendIcon,
  GetApp as GetIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { useNetwork } from '../../contexts/NetworkContext';
import useNetworkAwareAPI from '../../hooks/useNetworkAwareAPI';
import NetworkStatusIndicator from './NetworkStatusIndicator';

const NetworkDemo: React.FC = () => {
  const {
    isOnline,
    isSlowConnection,
    connectionQuality,
    queuedRequests,
    isProcessingQueue,
    processQueue,
    clearQueue,
    getNetworkAdvice
  } = useNetwork();

  const {
    get,
    post,
    shouldMakeRequest,
    getRequestRecommendations
  } = useNetworkAwareAPI();

  const [testUrl, setTestUrl] = useState('/api/v1/instructor/availability');
  const [testData, setTestData] = useState('{"test": "data"}');
  const [responses, setResponses] = useState<any[]>([]);

  // Test GET request
  const handleTestGet = async () => {
    try {
      const response = await get(testUrl);
      setResponses(prev => [...prev, {
        type: 'GET',
        url: testUrl,
        response,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      setResponses(prev => [...prev, {
        type: 'GET',
        url: testUrl,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  // Test POST request
  const handleTestPost = async () => {
    try {
      const data = JSON.parse(testData);
      const response = await post(testUrl, data);
      setResponses(prev => [...prev, {
        type: 'POST',
        url: testUrl,
        data,
        response,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      setResponses(prev => [...prev, {
        type: 'POST',
        url: testUrl,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  // Simulate network conditions
  const simulateOffline = () => {
    // This would typically be done through browser dev tools
    // but we can show what would happen
    alert('To test offline mode:\n1. Open Browser DevTools\n2. Go to Network tab\n3. Set to "Offline"\n4. Try making requests');
  };

  const simulateSlowConnection = () => {
    alert('To test slow connection:\n1. Open Browser DevTools\n2. Go to Network tab\n3. Set to "Slow 3G"\n4. Try making requests');
  };

  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOffIcon color="error" />;
    return <WifiIcon color={isSlowConnection ? 'warning' : 'success'} />;
  };

  const getConnectionColor = () => {
    if (!isOnline) return 'error';
    if (isSlowConnection) return 'warning';
    return 'success';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Network Status Indicator */}
      <NetworkStatusIndicator position="top-right" />

      <Typography variant="h4" gutterBottom>
        Network Context Demo
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        Test network-aware features including offline queuing, connection quality monitoring, and smart API handling.
      </Typography>

      <Grid container spacing={3}>
        {/* Current Network Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Current Network Status
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              {getConnectionIcon()}
              <Chip
                label={isOnline ? 'Online' : 'Offline'}
                color={getConnectionColor()}
                variant="filled"
              />
              <Chip
                label={connectionQuality}
                color={getConnectionColor()}
                variant="outlined"
              />
            </Box>

            <Alert severity={isOnline ? 'info' : 'warning'} sx={{ mb: 2 }}>
              {getNetworkAdvice()}
            </Alert>

            <Typography variant="subtitle2" gutterBottom>
              Request Recommendations:
            </Typography>
            <List dense>
              {getRequestRecommendations().map((rec, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <SpeedIcon />
                  </ListItemIcon>
                  <ListItemText primary={rec} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Offline Queue Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Offline Queue ({queuedRequests.length})
            </Typography>

            {queuedRequests.length === 0 ? (
              <Alert severity="success">
                No queued requests - all data is synced
              </Alert>
            ) : (
              <>
                <List dense sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                  {queuedRequests.map((request) => (
                    <ListItem key={request.id}>
                      <ListItemIcon>
                        <QueueIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${request.method} ${request.url}`}
                        secondary={`Queued at ${new Date(request.timestamp).toLocaleTimeString()}`}
                      />
                    </ListItem>
                  ))}
                </List>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={processQueue}
                    disabled={!isOnline || isProcessingQueue}
                    startIcon={<SendIcon />}
                  >
                    {isProcessingQueue ? 'Syncing...' : 'Sync Now'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={clearQueue}
                    disabled={isProcessingQueue}
                    color="error"
                  >
                    Clear Queue
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        {/* API Testing */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Test Network-Aware API Calls
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="API Endpoint"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="POST Data (JSON)"
                  value={testData}
                  onChange={(e) => setTestData(e.target.value)}
                  size="small"
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <Button
                variant="contained"
                onClick={handleTestGet}
                startIcon={<GetIcon />}
                disabled={!shouldMakeRequest()}
              >
                Test GET
              </Button>
              <Button
                variant="contained"
                onClick={handleTestPost}
                startIcon={<SendIcon />}
                disabled={!shouldMakeRequest()}
              >
                Test POST
              </Button>
              <Button
                variant="outlined"
                onClick={simulateOffline}
              >
                Simulate Offline
              </Button>
              <Button
                variant="outlined"
                onClick={simulateSlowConnection}
              >
                Simulate Slow
              </Button>
            </Box>

            {/* Response History */}
            {responses.length > 0 && (
              <>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Response History:
                </Typography>
                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {responses.slice(-10).reverse().map((resp, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${resp.type} ${resp.url} - ${resp.timestamp}`}
                        secondary={
                          <Box component="span">
                            {resp.error && (
                              <Chip label="Error" color="error" size="small" sx={{ mr: 1 }} />
                            )}
                            {resp.response?.isQueued && (
                              <Chip label="Queued" color="warning" size="small" sx={{ mr: 1 }} />
                            )}
                            {resp.response?.fromCache && (
                              <Chip label="From Cache" color="info" size="small" sx={{ mr: 1 }} />
                            )}
                            <br />
                            {resp.error || JSON.stringify(resp.response, null, 2).substring(0, 100)}...
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NetworkDemo; 