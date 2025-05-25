# Services Module

This module contains all service layer components for the CPR Training Portal, including API clients, analytics, authentication, and utility services.

## 📁 Directory Structure

```
services/
├── api.ts            # Main API client with interceptors
├── analytics.ts      # Analytics and tracking service
├── tokenService.ts   # JWT token management
└── README.md         # This file
```

## 🔧 Services Overview

### API Service (`api.ts`)

Central HTTP client for all API communications.

**Features:**
- Axios-based HTTP client
- Request/response interceptors
- Automatic token attachment
- Error handling and logging
- Base URL configuration

**Usage:**
```typescript
import api from '../services/api';

// GET request
const response = await api.get('/api/v1/instructor/classes');

// POST request
const result = await api.post('/api/v1/instructor/availability', { date: '2025-01-01' });

// PUT request
await api.put('/api/v1/instructor/classes/123/complete');

// DELETE request
await api.delete('/api/v1/instructor/availability/2025-01-01');
```

**Configuration:**
- Base URL: `http://localhost:3001` (development)
- Timeout: 10 seconds
- Content-Type: `application/json`

### Analytics Service (`analytics.ts`)

Comprehensive tracking and monitoring service for user interactions and performance metrics.

**Features:**
- User identification and session tracking
- Event tracking with custom properties
- Performance monitoring
- Error tracking and reporting
- Queue system for offline events
- Environment-based enabling

**Core Methods:**

#### User Management
```typescript
import analytics from '../services/analytics';

// Set current user
analytics.setUser(123, { 
  role: 'instructor', 
  email: 'instructor@example.com' 
});
```

#### Event Tracking
```typescript
// Generic event tracking
analytics.track('button_clicked', { 
  button: 'save_class',
  page: 'instructor_dashboard' 
});

// Page view tracking
analytics.trackPageView('instructor_dashboard');

// Instructor-specific actions
analytics.trackInstructorAction('class_created', { 
  classType: 'CPR Basic',
  duration: 4 
});

// Class management actions
analytics.trackClassAction('mark_complete', 123, { 
  studentsCount: 15,
  completionTime: 3600 
});

// Availability management
analytics.trackAvailabilityAction('add', '2025-01-01');
```

#### Error and Performance Tracking
```typescript
// Error tracking
try {
  await riskyOperation();
} catch (error) {
  analytics.trackError(error, 'component_name', { 
    additionalContext: 'value' 
  });
}

// Performance tracking
analytics.trackPerformance({
  name: 'api_response_time',
  value: 250,
  timestamp: new Date().toISOString(),
  metadata: { endpoint: '/api/v1/classes' }
});
```

**Configuration:**
- Enabled in production or when `REACT_APP_ANALYTICS_ENABLED=true`
- Session-based tracking
- Automatic page load performance monitoring

### Token Service (`tokenService.ts`)

JWT token management for authentication and authorization.

**Features:**
- Secure token storage
- Automatic token refresh
- Token validation
- Location saving for redirects

**Usage:**
```typescript
import { tokenService } from '../services/tokenService';

// Get current access token
const token = tokenService.getAccessToken();

// Save tokens after login
tokenService.saveTokens(accessToken, refreshToken);

// Clear tokens on logout
tokenService.clearTokens();

// Save current location for redirect
tokenService.saveCurrentLocation('/instructor/dashboard');

// Get and clear saved location
const location = tokenService.getSavedLocation();
tokenService.clearSavedLocation();
```

## 🔒 Security Considerations

### Token Management
- Access tokens stored in memory (not localStorage)
- Refresh tokens stored in secure HTTP-only cookies
- Automatic token refresh on API calls
- Token validation before requests

### API Security
- HTTPS in production
- CORS configuration
- Request/response sanitization
- Rate limiting (server-side)

### Analytics Privacy
- No PII in analytics events
- User consent handling
- Data retention policies
- GDPR compliance considerations

## 🚀 Performance Optimization

### API Client
- Request/response compression
- Connection pooling
- Request deduplication
- Caching strategies

### Analytics
- Event batching
- Offline queue management
- Performance metric sampling
- Lazy initialization

## 🧪 Testing

### API Service Testing
```typescript
// Mock API responses
jest.mock('../services/api');
const mockApi = api as jest.Mocked<typeof api>;

// Test API calls
mockApi.get.mockResolvedValue({ data: { success: true } });
```

### Analytics Testing
```typescript
// Mock analytics in tests
jest.mock('../services/analytics');

// Verify tracking calls
expect(analytics.track).toHaveBeenCalledWith('event_name', { prop: 'value' });
```

## 📊 Monitoring and Observability

### API Monitoring
- Request/response logging
- Error rate tracking
- Response time monitoring
- Endpoint usage analytics

### Analytics Monitoring
- Event delivery success rates
- Queue size monitoring
- Performance impact measurement
- Error tracking for analytics itself

## 🔧 Configuration

### Environment Variables

```bash
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:3001

# Analytics Configuration
REACT_APP_ANALYTICS_ENABLED=true
REACT_APP_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Development
NODE_ENV=development
```

### Service Configuration

```typescript
// API configuration
const apiConfig = {
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Analytics configuration
const analyticsConfig = {
  enabled: process.env.NODE_ENV === 'production' || 
           process.env.REACT_APP_ANALYTICS_ENABLED === 'true',
  providers: {
    googleAnalytics: process.env.REACT_APP_GA_MEASUREMENT_ID,
    mixpanel: process.env.REACT_APP_MIXPANEL_TOKEN
  }
};
```

## 🔄 Integration Patterns

### Service Integration in Components
```typescript
import { useEffect } from 'react';
import api from '../services/api';
import analytics from '../services/analytics';

const MyComponent = () => {
  useEffect(() => {
    const loadData = async () => {
      try {
        analytics.track('component_mounted', { component: 'MyComponent' });
        const response = await api.get('/api/v1/data');
        // Handle response
      } catch (error) {
        analytics.trackError(error, 'MyComponent');
      }
    };
    
    loadData();
  }, []);
  
  return <div>Component content</div>;
};
```

### Service Integration in Hooks
```typescript
import { useCallback } from 'react';
import api from '../services/api';
import analytics from '../services/analytics';

export const useApiCall = () => {
  const makeCall = useCallback(async (endpoint: string) => {
    const startTime = performance.now();
    
    try {
      const response = await api.get(endpoint);
      
      analytics.trackPerformance({
        name: 'api_call_duration',
        value: performance.now() - startTime,
        timestamp: new Date().toISOString(),
        metadata: { endpoint }
      });
      
      return response.data;
    } catch (error) {
      analytics.trackError(error, 'api_call', { endpoint });
      throw error;
    }
  }, []);
  
  return { makeCall };
};
```

## 🔗 Related Documentation

- [Components README](../components/README.md)
- [Hooks README](../hooks/README.md)
- [API Documentation](../../docs/api.md)
- [Authentication Guide](../../docs/authentication.md) 