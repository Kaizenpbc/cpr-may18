import logger from '../utils/logger';
import axios from 'axios';
import { API_URL } from '../config';

class ErrorLogger {
  static async logError(error, context = {}) {
    const errorData = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      type: error.name,
      context: {
        ...context,
        userAgent: navigator.userAgent,
        url: window.location.href,
        path: window.location.pathname,
      }
    };

    try {
      // Log to console for development
      logger.error('Error Details:', errorData);

      // Send to backend in production
      if (process.env.NODE_ENV === 'production') {
        await axios.post(`${API_URL}/api/logs/error`, errorData);
      }
    } catch (loggingError) {
      logger.error('Failed to log error:', loggingError);
    }
  }

  static async logRouteError(error, routeContext) {
    const context = {
      ...routeContext,
      errorType: 'route',
      status: error.status,
      statusText: error.statusText,
    };
    await this.logError(error, context);
  }

  static async logApiError(error, apiContext) {
    const context = {
      ...apiContext,
      errorType: 'api',
      status: error.response?.status,
      statusText: error.response?.statusText,
      endpoint: error.config?.url,
      method: error.config?.method,
    };
    await this.logError(error, context);
  }

  static async logAuthError(error, authContext) {
    const context = {
      ...authContext,
      errorType: 'auth',
      status: error.response?.status,
    };
    await this.logError(error, context);
  }
}

export default ErrorLogger; 