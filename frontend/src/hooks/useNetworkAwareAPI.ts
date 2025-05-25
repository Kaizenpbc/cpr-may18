import { useCallback } from 'react';
import { useNetwork } from '../contexts/NetworkContext';
import api from '../services/api';
import logger from '../utils/logger';

interface APIRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  headers?: Record<string, string>;
  maxRetries?: number;
  queueWhenOffline?: boolean;
  skipIfSlowConnection?: boolean;
}

interface APIResponse<T = any> {
  data?: T;
  error?: string;
  isQueued?: boolean;
  queueId?: string;
  fromCache?: boolean;
}

export const useNetworkAwareAPI = () => {
  const {
    isOnline,
    isSlowConnection,
    connectionQuality,
    queueRequest,
    canMakeRequest,
    shouldQueueRequest
  } = useNetwork();

  // Enhanced API request with network awareness
  const makeRequest = useCallback(async <T = any>(
    options: APIRequestOptions
  ): Promise<APIResponse<T>> => {
    const {
      url,
      method = 'GET',
      data,
      headers,
      maxRetries = 3,
      queueWhenOffline = true,
      skipIfSlowConnection = false
    } = options;

    // Check if we should skip due to slow connection
    if (skipIfSlowConnection && isSlowConnection) {
      logger.warn(`[NetworkAwareAPI] Skipping request due to slow connection: ${method} ${url}`);
      return {
        error: 'Request skipped due to slow connection'
      };
    }

    // If offline and queuing is enabled, queue the request
    if (!isOnline && queueWhenOffline) {
      const queueId = queueRequest({
        url,
        method,
        data,
        headers,
        maxRetries
      });

      logger.info(`[NetworkAwareAPI] Request queued: ${method} ${url}`);
      return {
        isQueued: true,
        queueId
      };
    }

    // If we can't make the request and queuing is disabled, return error
    if (!canMakeRequest() && !queueWhenOffline) {
      return {
        error: isOnline ? 'Connection too slow for this request' : 'No internet connection'
      };
    }

    // Make the actual API request
    try {
      logger.info(`[NetworkAwareAPI] Making request: ${method} ${url}`);
      
      const response = await api.request({
        url,
        method,
        data,
        headers: {
          'X-Connection-Quality': connectionQuality,
          'X-Network-Status': isOnline ? 'online' : 'offline',
          ...headers
        }
      });

      return {
        data: response.data
      };
    } catch (error: any) {
      logger.error(`[NetworkAwareAPI] Request failed: ${method} ${url}`, error);
      
      // If it's a network error and queuing is enabled, queue it
      if (queueWhenOffline && (error.code === 'NETWORK_ERROR' || !isOnline)) {
        const queueId = queueRequest({
          url,
          method,
          data,
          headers,
          maxRetries
        });

        return {
          isQueued: true,
          queueId,
          error: 'Request queued due to network error'
        };
      }

      return {
        error: error.message || 'Request failed'
      };
    }
  }, [isOnline, isSlowConnection, connectionQuality, queueRequest, canMakeRequest]);

  // Optimized GET request with caching
  const get = useCallback(async <T = any>(
    url: string,
    options?: Omit<APIRequestOptions, 'url' | 'method'>
  ): Promise<APIResponse<T>> => {
    // Check cache first for GET requests
    const cacheKey = `api_cache_${url}`;
    
    // If offline, try to return cached data
    if (!isOnline) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          
          // Use cached data if it's less than 1 hour old
          if (age < 60 * 60 * 1000) {
            logger.info(`[NetworkAwareAPI] Returning cached data for: ${url}`);
            return {
              data,
              fromCache: true
            };
          }
        }
      } catch (error) {
        logger.warn('[NetworkAwareAPI] Failed to read from cache:', error);
      }
    }

    const response = await makeRequest<T>({
      url,
      method: 'GET',
      ...options
    });

    // Cache successful responses
    if (response.data && !response.error && !response.isQueued) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: response.data,
          timestamp: Date.now()
        }));
      } catch (error) {
        logger.warn('[NetworkAwareAPI] Failed to cache response:', error);
      }
    }

    return response;
  }, [isOnline, makeRequest]);

  // POST request with automatic queuing
  const post = useCallback(async <T = any>(
    url: string,
    data?: any,
    options?: Omit<APIRequestOptions, 'url' | 'method' | 'data'>
  ): Promise<APIResponse<T>> => {
    return makeRequest<T>({
      url,
      method: 'POST',
      data,
      queueWhenOffline: true, // Always queue POST requests when offline
      ...options
    });
  }, [makeRequest]);

  // PUT request with automatic queuing
  const put = useCallback(async <T = any>(
    url: string,
    data?: any,
    options?: Omit<APIRequestOptions, 'url' | 'method' | 'data'>
  ): Promise<APIResponse<T>> => {
    return makeRequest<T>({
      url,
      method: 'PUT',
      data,
      queueWhenOffline: true, // Always queue PUT requests when offline
      ...options
    });
  }, [makeRequest]);

  // DELETE request with automatic queuing
  const del = useCallback(async <T = any>(
    url: string,
    options?: Omit<APIRequestOptions, 'url' | 'method'>
  ): Promise<APIResponse<T>> => {
    return makeRequest<T>({
      url,
      method: 'DELETE',
      queueWhenOffline: true, // Always queue DELETE requests when offline
      ...options
    });
  }, [makeRequest]);

  // PATCH request with automatic queuing
  const patch = useCallback(async <T = any>(
    url: string,
    data?: any,
    options?: Omit<APIRequestOptions, 'url' | 'method' | 'data'>
  ): Promise<APIResponse<T>> => {
    return makeRequest<T>({
      url,
      method: 'PATCH',
      data,
      queueWhenOffline: true, // Always queue PATCH requests when offline
      ...options
    });
  }, [makeRequest]);

  // Utility to check if a request should be made
  const shouldMakeRequest = useCallback((options?: {
    skipIfSlowConnection?: boolean;
    requireOnline?: boolean;
  }) => {
    const { skipIfSlowConnection = false, requireOnline = false } = options || {};
    
    if (requireOnline && !isOnline) return false;
    if (skipIfSlowConnection && isSlowConnection) return false;
    
    return true;
  }, [isOnline, isSlowConnection]);

  // Get network-aware request recommendations
  const getRequestRecommendations = useCallback(() => {
    const recommendations: string[] = [];

    if (!isOnline) {
      recommendations.push('You\'re offline. Requests will be queued and synced when connection is restored.');
    } else if (isSlowConnection) {
      recommendations.push('Slow connection detected. Consider deferring large uploads or downloads.');
    }

    switch (connectionQuality) {
      case 'poor':
        recommendations.push('Poor connection quality. Only essential requests are recommended.');
        break;
      case 'fair':
        recommendations.push('Fair connection quality. Large file operations may be slow.');
        break;
      case 'good':
        recommendations.push('Good connection quality. Most operations should work well.');
        break;
      case 'excellent':
        recommendations.push('Excellent connection quality. All operations should be fast.');
        break;
    }

    return recommendations;
  }, [isOnline, isSlowConnection, connectionQuality]);

  return {
    // Network status
    isOnline,
    isSlowConnection,
    connectionQuality,
    
    // API methods
    get,
    post,
    put,
    delete: del,
    patch,
    makeRequest,
    
    // Utilities
    shouldMakeRequest,
    getRequestRecommendations,
    canMakeRequest
  };
};

export default useNetworkAwareAPI; 