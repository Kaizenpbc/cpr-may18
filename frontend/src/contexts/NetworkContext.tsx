import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import logger from '../utils/logger';
import analytics from '../services/analytics';

// Types for network status and queued requests
interface QueuedRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

interface NetworkContextType {
  // Network status
  isOnline: boolean;
  isSlowConnection: boolean;
  networkStatus: NetworkStatus;
  
  // Connection quality
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  
  // Offline capabilities
  queuedRequests: QueuedRequest[];
  isProcessingQueue: boolean;
  
  // Actions
  queueRequest: (request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>) => string;
  removeQueuedRequest: (id: string) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
  
  // Network monitoring
  startNetworkMonitoring: () => void;
  stopNetworkMonitoring: () => void;
  
  // Utilities
  canMakeRequest: () => boolean;
  shouldQueueRequest: () => boolean;
  getNetworkAdvice: () => string;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
  enableOfflineQueue?: boolean;
  maxQueueSize?: number;
  syncInterval?: number;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({
  children,
  enableOfflineQueue = true,
  maxQueueSize = 50,
  syncInterval = 30000 // 30 seconds
}) => {
  // Network status state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0
  });

  // Offline queue state
  const [queuedRequests, setQueuedRequests] = useState<QueuedRequest[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Monitoring state
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [syncTimer, setSyncTimer] = useState<NodeJS.Timeout | null>(null);

  // Get connection quality based on network metrics
  const getConnectionQuality = useCallback((status: NetworkStatus): 'excellent' | 'good' | 'fair' | 'poor' | 'offline' => {
    if (!status.isOnline) return 'offline';
    
    const { downlink, rtt, effectiveType } = status;
    
    // Based on effective connection type
    if (effectiveType === '4g' && downlink > 10 && rtt < 100) return 'excellent';
    if (effectiveType === '4g' && downlink > 5 && rtt < 200) return 'good';
    if (effectiveType === '3g' || (downlink > 1.5 && rtt < 500)) return 'fair';
    
    return 'poor';
  }, []);

  // Update network status from Navigator API
  const updateNetworkStatus = useCallback(() => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    const newStatus: NetworkStatus = {
      isOnline: navigator.onLine,
      isSlowConnection: false,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0
    };

    // Determine if connection is slow
    newStatus.isSlowConnection = 
      newStatus.effectiveType === 'slow-2g' || 
      newStatus.effectiveType === '2g' ||
      (newStatus.downlink > 0 && newStatus.downlink < 1) ||
      newStatus.rtt > 1000;

    setNetworkStatus(newStatus);
    setIsOnline(newStatus.isOnline);
    setIsSlowConnection(newStatus.isSlowConnection);

    // Log significant network changes
    logger.info('[NetworkContext] Network status updated:', newStatus);
    
    return newStatus;
  }, []);

  // Handle online event
  const handleOnline = useCallback(() => {
    logger.info('[NetworkContext] Connection restored');
    updateNetworkStatus();
    
    // Track reconnection
    analytics.trackInstructorAction('network_reconnected', {
      timestamp: new Date().toISOString(),
      queuedRequestsCount: queuedRequests.length
    });

    // Process queued requests when coming back online
    if (enableOfflineQueue && queuedRequests.length > 0) {
      processQueue();
    }
  }, [queuedRequests.length, enableOfflineQueue]);

  // Handle offline event
  const handleOffline = useCallback(() => {
    logger.warn('[NetworkContext] Connection lost');
    updateNetworkStatus();
    
    // Track disconnection
    analytics.trackInstructorAction('network_disconnected', {
      timestamp: new Date().toISOString()
    });
  }, []);

  // Handle connection change
  const handleConnectionChange = useCallback(() => {
    const newStatus = updateNetworkStatus();
    
    // Track connection quality changes
    const quality = getConnectionQuality(newStatus);
    analytics.trackPerformance({
      name: 'network_quality_change',
      value: quality === 'excellent' ? 4 : quality === 'good' ? 3 : quality === 'fair' ? 2 : quality === 'poor' ? 1 : 0,
      timestamp: new Date().toISOString(),
      metadata: { 
        connectionType: newStatus.connectionType,
        effectiveType: newStatus.effectiveType,
        downlink: newStatus.downlink,
        rtt: newStatus.rtt
      }
    });
  }, [getConnectionQuality, updateNetworkStatus]);

  // Queue a request for later processing
  const queueRequest = useCallback((request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): string => {
    if (!enableOfflineQueue) {
      logger.warn('[NetworkContext] Offline queue is disabled');
      return '';
    }

    const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queuedRequest: QueuedRequest = {
      ...request,
      id,
      timestamp: Date.now(),
      retryCount: 0
    };

    setQueuedRequests(prev => {
      // Remove oldest requests if queue is full
      const newQueue = prev.length >= maxQueueSize ? prev.slice(1) : prev;
      return [...newQueue, queuedRequest];
    });

    logger.info(`[NetworkContext] Request queued: ${request.method} ${request.url}`);
    return id;
  }, [enableOfflineQueue, maxQueueSize]);

  // Remove a queued request
  const removeQueuedRequest = useCallback((id: string) => {
    setQueuedRequests(prev => prev.filter(req => req.id !== id));
  }, []);

  // Process all queued requests
  const processQueue = useCallback(async () => {
    if (!isOnline || isProcessingQueue || queuedRequests.length === 0) {
      return;
    }

    setIsProcessingQueue(true);
    logger.info(`[NetworkContext] Processing ${queuedRequests.length} queued requests`);

    const results = {
      successful: 0,
      failed: 0,
      retried: 0
    };

    for (const request of queuedRequests) {
      try {
        // Simulate API call (replace with actual fetch logic)
        const response = await fetch(request.url, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
            ...request.headers
          },
          body: request.data ? JSON.stringify(request.data) : undefined
        });

        if (response.ok) {
          results.successful++;
          removeQueuedRequest(request.id);
          logger.info(`[NetworkContext] Queued request successful: ${request.method} ${request.url}`);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        logger.error(`[NetworkContext] Queued request failed: ${request.method} ${request.url}`, error);
        
        // Retry logic
        if (request.retryCount < request.maxRetries) {
          setQueuedRequests(prev => 
            prev.map(req => 
              req.id === request.id 
                ? { ...req, retryCount: req.retryCount + 1 }
                : req
            )
          );
          results.retried++;
        } else {
          results.failed++;
          removeQueuedRequest(request.id);
        }
      }
    }

    setIsProcessingQueue(false);
    
    // Track queue processing results
    analytics.trackInstructorAction('queue_processed', {
      ...results,
      totalRequests: queuedRequests.length,
      timestamp: new Date().toISOString()
    });

    logger.info('[NetworkContext] Queue processing completed:', results);
  }, [isOnline, isProcessingQueue, queuedRequests, removeQueuedRequest]);

  // Clear all queued requests
  const clearQueue = useCallback(() => {
    setQueuedRequests([]);
    logger.info('[NetworkContext] Queue cleared');
  }, []);

  // Start network monitoring
  const startNetworkMonitoring = useCallback(() => {
    if (isMonitoring) return;

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor connection changes if supported
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Set up periodic sync
    if (enableOfflineQueue && syncInterval > 0) {
      const timer = setInterval(() => {
        if (isOnline && queuedRequests.length > 0) {
          processQueue();
        }
      }, syncInterval);
      setSyncTimer(timer);
    }

    setIsMonitoring(true);
    updateNetworkStatus();
    
    logger.info('[NetworkContext] Network monitoring started');
  }, [isMonitoring, handleOnline, handleOffline, handleConnectionChange, enableOfflineQueue, syncInterval, isOnline, queuedRequests.length, processQueue, updateNetworkStatus]);

  // Stop network monitoring
  const stopNetworkMonitoring = useCallback(() => {
    if (!isMonitoring) return;

    // Remove event listeners
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.removeEventListener('change', handleConnectionChange);
    }

    // Clear sync timer
    if (syncTimer) {
      clearInterval(syncTimer);
      setSyncTimer(null);
    }

    setIsMonitoring(false);
    logger.info('[NetworkContext] Network monitoring stopped');
  }, [isMonitoring, handleOnline, handleOffline, handleConnectionChange, syncTimer]);

  // Utility functions
  const canMakeRequest = useCallback(() => {
    return isOnline && !isSlowConnection;
  }, [isOnline, isSlowConnection]);

  const shouldQueueRequest = useCallback(() => {
    return enableOfflineQueue && (!isOnline || isSlowConnection);
  }, [enableOfflineQueue, isOnline, isSlowConnection]);

  const getNetworkAdvice = useCallback(() => {
    const quality = getConnectionQuality(networkStatus);
    
    switch (quality) {
      case 'offline':
        return 'You\'re offline. Changes will be saved and synced when connection is restored.';
      case 'poor':
        return 'Slow connection detected. Some features may be limited.';
      case 'fair':
        return 'Connection quality is fair. Large uploads may take longer.';
      case 'good':
        return 'Good connection quality.';
      case 'excellent':
        return 'Excellent connection quality.';
      default:
        return 'Connection status unknown.';
    }
  }, [networkStatus, getConnectionQuality]);

  // Auto-start monitoring on mount
  useEffect(() => {
    startNetworkMonitoring();
    return () => {
      stopNetworkMonitoring();
    };
  }, [startNetworkMonitoring, stopNetworkMonitoring]);

  // Load queued requests from localStorage on mount
  useEffect(() => {
    if (enableOfflineQueue) {
      try {
        const saved = localStorage.getItem('networkQueue');
        if (saved) {
          const parsed = JSON.parse(saved);
          setQueuedRequests(parsed);
          logger.info(`[NetworkContext] Loaded ${parsed.length} requests from storage`);
        }
      } catch (error) {
        logger.error('[NetworkContext] Failed to load queue from storage:', error);
      }
    }
  }, [enableOfflineQueue]);

  // Save queued requests to localStorage
  useEffect(() => {
    if (enableOfflineQueue) {
      try {
        localStorage.setItem('networkQueue', JSON.stringify(queuedRequests));
      } catch (error) {
        logger.error('[NetworkContext] Failed to save queue to storage:', error);
      }
    }
  }, [queuedRequests, enableOfflineQueue]);

  const connectionQuality = getConnectionQuality(networkStatus);

  const value: NetworkContextType = {
    // Network status
    isOnline,
    isSlowConnection,
    networkStatus,
    connectionQuality,
    
    // Offline capabilities
    queuedRequests,
    isProcessingQueue,
    
    // Actions
    queueRequest,
    removeQueuedRequest,
    processQueue,
    clearQueue,
    
    // Network monitoring
    startNetworkMonitoring,
    stopNetworkMonitoring,
    
    // Utilities
    canMakeRequest,
    shouldQueueRequest,
    getNetworkAdvice
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

// Custom hook to use network context
export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

export default NetworkContext; 