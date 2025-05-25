/**
 * Analytics Service for Instructor Portal
 * Tracks user interactions, performance metrics, and errors
 */

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: string;
  userId?: string | number;
  sessionId?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

class AnalyticsService {
  private isEnabled: boolean;
  private sessionId: string;
  private userId: string | number | null = null;
  private queue: AnalyticsEvent[] = [];
  private isInitialized = false;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production' || process.env.REACT_APP_ANALYTICS_ENABLED === 'true';
    this.sessionId = this.generateSessionId();
    
    if (this.isEnabled) {
      this.initialize();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initialize() {
    // Initialize analytics (Google Analytics, Mixpanel, etc.)
    console.log('[Analytics] Service initialized', {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    });
    
    // Track page load performance
    this.trackPageLoad();
    
    this.isInitialized = true;
    
    // Process queued events
    this.processQueue();
  }

  /**
   * Set the current user for analytics tracking
   */
  setUser(userId: string | number, properties?: Record<string, any>) {
    this.userId = userId;
    
    if (this.isEnabled) {
      console.log('[Analytics] User identified:', { userId, properties });
      
      // TODO: Integrate with actual analytics service
      // gtag('config', 'GA_MEASUREMENT_ID', { user_id: userId });
      // mixpanel.identify(userId);
    }
  }

  /**
   * Track a custom event
   */
  track(event: string, properties?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      },
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    };

    if (!this.isInitialized) {
      this.queue.push(analyticsEvent);
      return;
    }

    if (this.isEnabled) {
      console.log('[Analytics] Event tracked:', analyticsEvent);
      
      // TODO: Send to actual analytics service
      // gtag('event', event, properties);
      // mixpanel.track(event, properties);
    }
  }

  /**
   * Track page views
   */
  trackPageView(page: string, properties?: Record<string, any>) {
    this.track('page_view', {
      page,
      ...properties
    });
  }

  /**
   * Track instructor-specific actions
   */
  trackInstructorAction(action: string, properties?: Record<string, any>) {
    this.track('instructor_action', {
      action,
      portal: 'instructor',
      ...properties
    });
  }

  /**
   * Track class management actions
   */
  trackClassAction(action: string, classId?: number, properties?: Record<string, any>) {
    this.track('class_action', {
      action,
      classId,
      portal: 'instructor',
      ...properties
    });
  }

  /**
   * Track availability management
   */
  trackAvailabilityAction(action: string, date?: string, properties?: Record<string, any>) {
    this.track('availability_action', {
      action,
      date,
      portal: 'instructor',
      ...properties
    });
  }

  /**
   * Track errors
   */
  trackError(error: Error, context?: string, properties?: Record<string, any>) {
    this.track('error_occurred', {
      error: error.message,
      stack: error.stack,
      context,
      portal: 'instructor',
      ...properties
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: PerformanceMetric) {
    if (this.isEnabled) {
      console.log('[Analytics] Performance metric:', metric);
      
      // TODO: Send to performance monitoring service
      // Sentry.addBreadcrumb({ message: `Performance: ${metric.name}`, data: metric });
    }
  }

  /**
   * Track page load performance
   */
  private trackPageLoad() {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.trackPerformance({
          name: 'page_load_time',
          value: navigation.loadEventEnd - navigation.loadEventStart,
          timestamp: new Date().toISOString(),
          metadata: {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            firstPaint: navigation.loadEventStart - navigation.fetchStart,
            portal: 'instructor'
          }
        });
      }
    }
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName: string, renderTime: number) {
    this.trackPerformance({
      name: 'component_render_time',
      value: renderTime,
      timestamp: new Date().toISOString(),
      metadata: {
        component: componentName,
        portal: 'instructor'
      }
    });
  }

  /**
   * Process queued events
   */
  private processQueue() {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) {
        this.track(event.event, event.properties);
      }
    }
  }

  /**
   * Flush any pending analytics data
   */
  flush() {
    if (this.isEnabled) {
      console.log('[Analytics] Flushing pending data');
      // TODO: Implement actual flush logic for analytics service
    }
  }
}

// Create singleton instance
const analytics = new AnalyticsService();

export default analytics; 