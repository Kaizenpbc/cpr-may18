import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { tokenService } from '../services/tokenService';
import logger from '../utils/logger';
import analytics from '../services/analytics';

// Types
interface ScheduledClass {
  course_id: number;
  datescheduled: string;
  completed: boolean;
  organizationname: string;
  coursetypename: string;
  location: string;
  studentcount: number;
  studentsattendance: number;
}

interface Student {
  student_id: number;
  first_name: string;
  last_name: string;
  attendance: boolean;
}

interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  maxRetries: number;
  nextRetryIn?: number;
}

// Enhanced error types
interface EnhancedError {
  message: string;
  code?: string;
  statusCode?: number;
  isRetryable: boolean;
  userMessage: string;
  suggestion?: string;
}

// Query Keys for React Query
const QUERY_KEYS = {
  availability: ['instructor', 'availability'],
  classes: ['instructor', 'classes'],
  completedClasses: ['instructor', 'classes', 'completed'],
  classStudents: (courseId: number) => ['instructor', 'classes', courseId, 'students'],
  todayClasses: ['instructor', 'classes', 'today'],
} as const;

// Enhanced retry configuration
const RETRY_CONFIG = {
  availability: { maxRetries: 2, baseDelay: 1000 },
  classes: { maxRetries: 3, baseDelay: 1000 },
  completedClasses: { maxRetries: 2, baseDelay: 1000 },
  critical: { maxRetries: 5, baseDelay: 500 },
} as const;

// Smart retry function with exponential backoff + jitter
const createRetryFn = (maxRetries: number, baseDelay: number) => {
  return (failureCount: number, error: any): boolean => {
    // Don't retry client errors (4xx) except 408, 429
    if (error?.response?.status >= 400 && error?.response?.status < 500) {
      if (![408, 429].includes(error.response.status)) {
        return false;
      }
    }
    
    return failureCount < maxRetries;
  };
};

// Enhanced retry delay with exponential backoff + jitter
const createRetryDelay = (baseDelay: number) => {
  return (attemptIndex: number): number => {
    // Exponential backoff: baseDelay * 2^attemptIndex
    const exponentialDelay = baseDelay * Math.pow(2, attemptIndex);
    
    // Add jitter (±25% randomness) to prevent thundering herd
    const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
    
    // Cap at 30 seconds
    return Math.min(exponentialDelay + jitter, 30000);
  };
};

// Enhanced error message mapping
const getEnhancedError = (error: any, context: string): EnhancedError => {
  const statusCode = error?.response?.status;
  const errorCode = error?.code;
  const backendMessage = error?.response?.data?.error?.message || error?.response?.data?.message;
  
  // Network errors
  if (!statusCode && (errorCode === 'NETWORK_ERROR' || error.message?.includes('Network Error'))) {
    return {
      message: error.message,
      code: 'NETWORK_ERROR',
      isRetryable: true,
      userMessage: 'Connection problem detected',
      suggestion: 'Check your internet connection and we\'ll retry automatically'
    };
  }
  
  // HTTP status code errors
  switch (statusCode) {
    case 400:
      // Special handling for attendance validation errors
      if (backendMessage?.includes('attendance')) {
        return {
          message: backendMessage,
          statusCode,
          code: 'VALIDATION_ERROR',
          isRetryable: false,
          userMessage: 'Cannot complete class',
          suggestion: backendMessage || 'Please mark attendance for all students before completing the class.'
        };
      }
      return {
        message: backendMessage || error.message,
        statusCode,
        code: 'VALIDATION_ERROR',
        isRetryable: false,
        userMessage: 'Invalid request',
        suggestion: backendMessage || 'Please check your input and try again'
      };
      
    case 401:
      return {
        message: error.message,
        statusCode,
        code: 'UNAUTHORIZED',
        isRetryable: false,
        userMessage: 'Session expired',
        suggestion: 'Please log in again'
      };
      
    case 403:
      return {
        message: error.message,
        statusCode,
        code: 'FORBIDDEN',
        isRetryable: false,
        userMessage: 'Access denied',
        suggestion: 'You don\'t have permission for this action'
      };
      
    case 404:
      return {
        message: error.message,
        statusCode,
        code: 'NOT_FOUND',
        isRetryable: false,
        userMessage: context.includes('class') ? 'Class not found' : 'Resource not found',
        suggestion: context.includes('class') ? 'The class may have been cancelled or moved' : 'The requested resource is no longer available'
      };
      
    case 408:
    case 429:
      return {
        message: error.message,
        statusCode,
        code: statusCode === 408 ? 'TIMEOUT' : 'RATE_LIMITED',
        isRetryable: true,
        userMessage: statusCode === 408 ? 'Request timed out' : 'Too many requests',
        suggestion: 'We\'ll retry this automatically in a moment'
      };
      
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        message: error.message,
        statusCode,
        code: 'SERVER_ERROR',
        isRetryable: true,
        userMessage: 'Server temporarily unavailable',
        suggestion: 'We\'re working on fixing this. Retrying automatically...'
      };
      
    default:
      return {
        message: backendMessage || error.message || 'Unknown error occurred',
        statusCode,
        code: 'UNKNOWN',
        isRetryable: statusCode ? statusCode >= 500 : true,
        userMessage: `Failed to ${context}`,
        suggestion: backendMessage || 'Please try again or contact support if this continues'
      };
  }
};

// API Functions with enhanced error handling
const fetchAvailability = async () => {
  try {
    const response = await api.get('/api/v1/instructor/availability');
    const data = response.data.data || [];
    logger.info('[useInstructorData] Availability data fetched:', data);
    return data;
  } catch (error) {
    const enhancedError = getEnhancedError(error, 'load availability');
    logger.error('[useInstructorData] Availability fetch error:', enhancedError);
    throw enhancedError;
  }
};

const fetchScheduledClasses = async () => {
  try {
    const response = await api.get('/api/v1/instructor/classes');
    return response.data.data || [];
  } catch (error) {
    const enhancedError = getEnhancedError(error, 'load scheduled classes');
    logger.error('[useInstructorData] Classes fetch error:', enhancedError);
    throw enhancedError;
  }
};

const fetchCompletedClasses = async () => {
  try {
    const response = await api.get('/api/v1/instructor/classes/completed');
    return response.data.data?.classes || response.data.data || [];
  } catch (error) {
    const enhancedError = getEnhancedError(error, 'load completed classes');
    logger.error('[useInstructorData] Completed classes fetch error:', enhancedError);
    throw enhancedError;
  }
};

const fetchClassStudents = async (courseId: number) => {
  try {
    const response = await api.get('/api/v1/instructor/classes/students', { 
      params: { course_id: courseId } 
    });
    return response.data || [];
  } catch (error) {
    const enhancedError = getEnhancedError(error, 'load class students');
    logger.error('[useInstructorData] Students fetch error:', enhancedError);
    throw enhancedError;
  }
};

export const useInstructorData = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<EnhancedError | null>(null);
  const [retryStates, setRetryStates] = useState<Record<string, RetryState>>({});

  // Helper to update retry state
  const updateRetryState = useCallback((queryKey: string, state: Partial<RetryState>) => {
    setRetryStates(prev => ({
      ...prev,
      [queryKey]: { ...prev[queryKey], ...state }
    }));
  }, []);

  // Enhanced onError handler
  const createErrorHandler = useCallback((queryKey: string, context: string) => {
    return (error: any) => {
      const enhancedError = getEnhancedError(error, context);
      
      // Handle auth errors
      if (enhancedError.statusCode === 401) {
        logout();
        return;
      }
      
      setError(enhancedError);
      
             // Track error for analytics
       logger.error(`[useInstructorData] ${context} error:`, enhancedError);
    };
  }, [logout]);

  // Enhanced onRetry handler
  const createRetryHandler = useCallback((queryKey: string, maxRetries: number) => {
    return (failureCount: number, error: any) => {
      const enhancedError = getEnhancedError(error, 'retry');
      
      updateRetryState(queryKey, {
        isRetrying: true,
        retryCount: failureCount,
        maxRetries,
      });
      
      logger.info(`[useInstructorData] Retrying ${queryKey} (${failureCount}/${maxRetries})`, enhancedError);
    };
  }, [updateRetryState]);

  // Availability Query with enhanced retry
  const {
    data: availabilityData = [],
    isLoading: availabilityLoading,
    error: availabilityError,
    isFetching: availabilityFetching,
  } = useQuery({
    queryKey: QUERY_KEYS.availability,
    queryFn: fetchAvailability,
    enabled: isAuthenticated && !!user,
    staleTime: 30 * 1000, // 30 seconds (reduced from 5 minutes)
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: createRetryFn(RETRY_CONFIG.availability.maxRetries, RETRY_CONFIG.availability.baseDelay),
    retryDelay: createRetryDelay(RETRY_CONFIG.availability.baseDelay),
  });

  // Scheduled Classes Query with enhanced retry
  const {
    data: scheduledClasses = [],
    isLoading: classesLoading,
    error: classesError,
    isFetching: classesFetching,
  } = useQuery({
    queryKey: QUERY_KEYS.classes,
    queryFn: fetchScheduledClasses,
    enabled: isAuthenticated && !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: createRetryFn(RETRY_CONFIG.classes.maxRetries, RETRY_CONFIG.classes.baseDelay),
    retryDelay: createRetryDelay(RETRY_CONFIG.classes.baseDelay),
  });

  // Completed Classes Query with enhanced retry
  const {
    data: completedClasses = [],
    isLoading: completedLoading,
    error: completedError,
    isFetching: completedFetching,
  } = useQuery({
    queryKey: QUERY_KEYS.completedClasses,
    queryFn: fetchCompletedClasses,
    enabled: isAuthenticated && !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: createRetryFn(RETRY_CONFIG.completedClasses.maxRetries, RETRY_CONFIG.completedClasses.baseDelay),
    retryDelay: createRetryDelay(RETRY_CONFIG.completedClasses.baseDelay),
  });

  // Enhanced mutations with better error handling
  const addAvailabilityMutation = useMutation({
    mutationFn: async (date: string) => {
      try {
        const response = await api.post('/api/v1/instructor/availability', { date });
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to add availability');
        }
        return date;
      } catch (error) {
        const enhancedError = getEnhancedError(error, 'add availability');
        throw enhancedError;
      }
    },
    onSuccess: (date) => {
      // Optimistically update cache
      queryClient.setQueryData(QUERY_KEYS.availability, (old: any[] = []) => [
        ...old,
        { date }
      ]);
      analytics.trackAvailabilityAction('add', date);
      setError(null); // Clear any previous errors
    },
    onError: (error: EnhancedError) => {
      logger.error('[useInstructorData] Error adding availability:', error);
      setError(error);
    },
  });

  const removeAvailabilityMutation = useMutation({
    mutationFn: async (date: string) => {
      try {
        await api.delete(`/api/v1/instructor/availability/${date}`);
        return date;
      } catch (error) {
        const enhancedError = getEnhancedError(error, 'remove availability');
        throw enhancedError;
      }
    },
    onSuccess: (date) => {
      // Optimistically update cache
      queryClient.setQueryData(QUERY_KEYS.availability, (old: any[] = []) =>
        old.filter((avail: any) => avail.date !== date)
      );
      analytics.trackAvailabilityAction('remove', date);
      setError(null);
    },
    onError: (error: EnhancedError) => {
      logger.error('[useInstructorData] Error removing availability:', error);
      setError(error);
    },
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ studentId, attendance }: { studentId: number; attendance: boolean }) => {
      try {
        await api.post('/api/v1/instructor/classes/students/attendance', { 
          student_id: studentId, 
          attendance 
        });
        return { studentId, attendance };
      } catch (error) {
        const enhancedError = getEnhancedError(error, 'update attendance');
        throw enhancedError;
      }
    },
    onSuccess: () => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.classes });
      analytics.trackInstructorAction('update_attendance');
      setError(null);
    },
    onError: (error: EnhancedError) => {
      logger.error('[useInstructorData] Error updating attendance:', error);
      setError(error);
    },
  });

  const completeClassMutation = useMutation({
    mutationFn: async (courseId: number) => {
      try {
        const response = await api.put(`/api/v1/instructor/classes/${courseId}/complete`, {
          generateCertificates: false
        });
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to complete class');
        }
        return { courseId, studentsAttended: response.data.data.students_attended };
      } catch (error) {
        const enhancedError = getEnhancedError(error, 'complete class');
        throw enhancedError;
      }
    },
    onSuccess: async ({ courseId }) => {
      // Small delay to ensure backend has processed the update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reset query data to force fresh fetch
      queryClient.resetQueries({ queryKey: QUERY_KEYS.availability });
      
      // Invalidate queries to refresh data from server
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.classes });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.completedClasses });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.availability });
      
      analytics.trackClassAction('completed_successfully', courseId);
      setError(null);
    },
    onError: (error: EnhancedError) => {
      logger.error('[useInstructorData] Error completing class:', error);
      setError(error);
    },
  });

  // Manual retry function
  const retryFailedQueries = useCallback(async () => {
    const failedQueries = [
      { key: QUERY_KEYS.availability, error: availabilityError },
      { key: QUERY_KEYS.classes, error: classesError },
      { key: QUERY_KEYS.completedClasses, error: completedError },
    ].filter(q => q.error);

    for (const query of failedQueries) {
      await queryClient.invalidateQueries({ queryKey: query.key });
    }
  }, [queryClient, availabilityError, classesError, completedError]);

  // Optimized class students fetcher with caching
  const fetchClassStudentsOptimized = useCallback(async (courseId: number): Promise<Student[]> => {
    const cachedData = queryClient.getQueryData(QUERY_KEYS.classStudents(courseId));
    if (cachedData) {
      return cachedData as Student[];
    }

    try {
      const students = await fetchClassStudents(courseId);
      // Cache the result for 5 minutes
      queryClient.setQueryData(QUERY_KEYS.classStudents(courseId), students);
      return students;
    } catch (error: any) {
      const enhancedError = getEnhancedError(error, 'load class students');
      logger.error('[useInstructorData] Error fetching students:', enhancedError);
      throw enhancedError;
    }
  }, [queryClient]);

  // Manual refresh function
  const loadData = useCallback(async () => {
    const startTime = performance.now();
    
    try {
      setError(null);
      
      // Invalidate all queries to force refresh
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.availability }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.classes }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.completedClasses }),
      ]);

      const loadTime = performance.now() - startTime;
      analytics.trackPerformance({
        name: 'instructor_data_refresh_time',
        value: loadTime,
        timestamp: new Date().toISOString(),
        metadata: { portal: 'instructor', type: 'manual_refresh' }
      });
    } catch (error: any) {
      const enhancedError = getEnhancedError(error, 'refresh data');
      logger.error('[useInstructorData] Error refreshing data:', enhancedError);
      setError(enhancedError);
    }
  }, [queryClient]);

  // Prefetch today's classes on mount for better UX
  useEffect(() => {
    if (isAuthenticated && user) {
      queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.todayClasses,
        queryFn: () => api.get('/api/v1/instructor/classes/today').then(res => res.data.data),
        staleTime: 1 * 60 * 1000, // 1 minute
      });
    }
  }, [isAuthenticated, user, queryClient]);

  // Handle query errors
  useEffect(() => {
    if (availabilityError) {
      const enhancedError = getEnhancedError(availabilityError, 'load availability');
      if (enhancedError.statusCode === 401) {
        logout();
      } else {
        setError(enhancedError);
      }
    }
  }, [availabilityError, logout]);

  useEffect(() => {
    if (classesError) {
      const enhancedError = getEnhancedError(classesError, 'load scheduled classes');
      if (enhancedError.statusCode === 401) {
        logout();
      } else {
        setError(enhancedError);
      }
    }
  }, [classesError, logout]);

  useEffect(() => {
    if (completedError) {
      const enhancedError = getEnhancedError(completedError, 'load completed classes');
      if (enhancedError.statusCode === 401) {
        logout();
      } else {
        setError(enhancedError);
      }
    }
  }, [completedError, logout]);

  // Clear error after 10 seconds (longer for enhanced errors)
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Compute derived state
  const availableDates = new Set((availabilityData as any[]).map((avail: { date: string }) => avail.date));
  const loading = availabilityLoading || classesLoading || completedLoading;
  const isFetching = availabilityFetching || classesFetching || completedFetching;
  const hasError = availabilityError || classesError || completedError || error;

  return {
    // Data
    availableDates,
    scheduledClasses,
    completedClasses,
    
    // Loading states
    loading,
    isFetching,
    error,
    
    // Retry states
    retryStates,
    retryFailedQueries,
    
    // Actions with enhanced error handling
    addAvailability: (date: string) => addAvailabilityMutation.mutateAsync(date),
    removeAvailability: (date: string) => removeAvailabilityMutation.mutateAsync(date),
    updateAttendance: (studentId: number, attendance: boolean) => 
      updateAttendanceMutation.mutateAsync({ studentId, attendance }),
    completeClass: (courseId: number) => completeClassMutation.mutateAsync(courseId),
    
    // Optimized functions
    fetchClassStudents: fetchClassStudentsOptimized,
    loadData,
    
    // Loading states for individual operations
    isAddingAvailability: addAvailabilityMutation.isPending,
    isRemovingAvailability: removeAvailabilityMutation.isPending,
    isUpdatingAttendance: updateAttendanceMutation.isPending,
    isCompletingClass: completeClassMutation.isPending,
  };
}; 