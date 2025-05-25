import { useCallback } from 'react';
import { useInstructorData } from './useInstructorData';
import { useToast } from '../contexts/ToastContext';
import { useNetwork } from '../contexts/NetworkContext';

/**
 * Enhanced version of useInstructorData that integrates with toast notifications
 * Provides better user feedback for all operations
 */
export const useInstructorDataWithToasts = () => {
  const instructorData = useInstructorData();
  const { success, error, warning, info, loading, updateToast } = useToast();
  const { isOnline, connectionQuality } = useNetwork();

  // Enhanced add availability with toast feedback
  const addAvailabilityWithToast = useCallback(async (date: string) => {
    // Check network status
    if (!isOnline) {
      warning('You are offline. Changes will be saved when connection is restored.', {
        title: 'Offline Mode',
        context: 'availability_offline',
        duration: 6000
      });
      return;
    }

    // Show loading toast
    const loadingId = loading('Adding availability...', {
      title: 'Please Wait',
      context: 'availability_add'
    });

    try {
      await instructorData.addAvailability(date);
      
      // Update loading toast to success
      updateToast(loadingId, {
        type: 'success',
        title: 'Success',
        message: `Availability added for ${new Date(date).toLocaleDateString()}`,
        duration: 4000,
        dismissible: true,
        showProgress: true
      });

      return { success: true };
    } catch (err: any) {
      // Update loading toast to error
      updateToast(loadingId, {
        type: 'error',
        title: 'Failed to Add Availability',
        message: err.userMessage || 'Unable to add availability. Please try again.',
        duration: 0, // Persistent for errors
        dismissible: true,
        actions: err.isRetryable ? [
          {
            label: 'Retry',
            onClick: () => addAvailabilityWithToast(date),
            color: 'primary',
            variant: 'contained'
          }
        ] : [
          {
            label: 'Contact Support',
            onClick: () => {
              info('Please contact support for assistance with this issue.');
            },
            color: 'secondary'
          }
        ]
      });

      return { success: false, error: err.userMessage };
    }
  }, [instructorData, loading, updateToast, isOnline, warning, info]);

  // Enhanced remove availability with toast feedback
  const removeAvailabilityWithToast = useCallback(async (date: string) => {
    if (!isOnline) {
      warning('You are offline. Changes will be saved when connection is restored.', {
        title: 'Offline Mode',
        context: 'availability_offline',
        duration: 6000
      });
      return;
    }

    const loadingId = loading('Removing availability...', {
      title: 'Please Wait',
      context: 'availability_remove'
    });

    try {
      await instructorData.removeAvailability(date);
      
      updateToast(loadingId, {
        type: 'success',
        title: 'Success',
        message: `Availability removed for ${new Date(date).toLocaleDateString()}`,
        duration: 4000,
        dismissible: true,
        showProgress: true
      });

      return { success: true };
    } catch (err: any) {
      updateToast(loadingId, {
        type: 'error',
        title: 'Failed to Remove Availability',
        message: err.userMessage || 'Unable to remove availability. Please try again.',
        duration: 0,
        dismissible: true,
        actions: err.isRetryable ? [
          {
            label: 'Retry',
            onClick: () => removeAvailabilityWithToast(date),
            color: 'primary',
            variant: 'contained'
          }
        ] : []
      });

      return { success: false, error: err.userMessage };
    }
  }, [instructorData, loading, updateToast, isOnline, warning]);

  // Enhanced update attendance with toast feedback
  const updateAttendanceWithToast = useCallback(async (studentId: number, attendance: boolean, studentName?: string) => {
    if (!isOnline) {
      warning('You are offline. Attendance changes will be saved when connection is restored.', {
        title: 'Offline Mode',
        context: 'attendance_offline',
        duration: 6000
      });
      return;
    }

    const studentDisplay = studentName || `Student ${studentId}`;
    const action = attendance ? 'marked present' : 'marked absent';
    
    const loadingId = loading(`Updating attendance for ${studentDisplay}...`, {
      title: 'Updating Attendance',
      context: 'attendance_update'
    });

    try {
      await instructorData.updateAttendance(studentId, attendance);
      
      updateToast(loadingId, {
        type: 'success',
        title: 'Attendance Updated',
        message: `${studentDisplay} ${action}`,
        duration: 3000,
        dismissible: true,
        showProgress: true
      });

      return { success: true };
    } catch (err: any) {
      updateToast(loadingId, {
        type: 'error',
        title: 'Failed to Update Attendance',
        message: err.userMessage || 'Unable to update attendance. Please try again.',
        duration: 0,
        dismissible: true,
        actions: [
          {
            label: 'Retry',
            onClick: () => updateAttendanceWithToast(studentId, attendance, studentName),
            color: 'primary',
            variant: 'contained'
          }
        ]
      });

      return { success: false, error: err.userMessage };
    }
  }, [instructorData, loading, updateToast, isOnline, warning]);

  // Enhanced complete class with toast feedback
  const completeClassWithToast = useCallback(async (courseId: number, className?: string) => {
    if (!isOnline) {
      warning('You are offline. Class completion will be processed when connection is restored.', {
        title: 'Offline Mode',
        context: 'class_complete_offline',
        duration: 6000
      });
      return;
    }

    const classDisplay = className || `Class ${courseId}`;
    
    const loadingId = loading(`Completing ${classDisplay}...`, {
      title: 'Processing Class Completion',
      context: 'class_complete'
    });

    try {
      const result = await instructorData.completeClass(courseId);
      
      updateToast(loadingId, {
        type: 'success',
        title: 'Class Completed Successfully',
        message: `${classDisplay} has been marked as completed`,
        duration: 5000,
        dismissible: true,
        showProgress: true,
        actions: [
          {
            label: 'View Archive',
            onClick: () => {
              // Navigate to archive or show archive info
              info('Class moved to archive. You can view it in the Archive section.');
            },
            color: 'primary'
          }
        ]
      });

      return result;
    } catch (err: any) {
      updateToast(loadingId, {
        type: 'error',
        title: 'Failed to Complete Class',
        message: err.userMessage || 'Unable to complete class. Please try again.',
        duration: 0,
        dismissible: true,
        actions: [
          {
            label: 'Retry',
            onClick: () => completeClassWithToast(courseId, className),
            color: 'primary',
            variant: 'contained'
          },
          ...(err.message?.includes('attendance') ? [
            {
              label: 'Check Attendance',
              onClick: () => {
                info('Please ensure all students have their attendance marked before completing the class.');
              },
                             color: 'warning' as const
            }
          ] : [])
        ]
      });

      return { success: false, error: err.userMessage };
    }
  }, [instructorData, loading, updateToast, isOnline, warning, info]);

  // Enhanced data refresh with toast feedback
  const loadDataWithToast = useCallback(async () => {
    if (!isOnline) {
      warning('You are offline. Data will be refreshed when connection is restored.', {
        title: 'Offline Mode',
        context: 'data_refresh_offline',
        duration: 6000
      });
      return;
    }

    // Show different messages based on connection quality
    let loadingMessage = 'Refreshing data...';
    if (connectionQuality === 'poor') {
      loadingMessage = 'Refreshing data... (slow connection detected)';
    }

    const loadingId = loading(loadingMessage, {
      title: 'Updating Information',
      context: 'data_refresh'
    });

    try {
      await instructorData.loadData();
      
      updateToast(loadingId, {
        type: 'success',
        title: 'Data Updated',
        message: 'All information has been refreshed',
        duration: 3000,
        dismissible: true,
        showProgress: true
      });
    } catch (err: any) {
      updateToast(loadingId, {
        type: 'error',
        title: 'Failed to Refresh Data',
        message: err.userMessage || 'Unable to refresh data. Please try again.',
        duration: 0,
        dismissible: true,
        actions: [
          {
            label: 'Retry',
            onClick: () => loadDataWithToast(),
            color: 'primary',
            variant: 'contained'
          }
        ]
      });
    }
  }, [instructorData, loading, updateToast, isOnline, warning, connectionQuality]);

  // Network status notifications
  const showNetworkStatusToast = useCallback((status: 'online' | 'offline') => {
    if (status === 'offline') {
      error('Connection lost. You can continue working offline.', {
        title: 'Network Disconnected',
        context: 'network_offline',
        duration: 0, // Persistent
        actions: [
          {
            label: 'Retry Connection',
            onClick: () => {
              // Trigger a test request to check connectivity
              loadDataWithToast();
            },
            color: 'primary'
          }
        ]
      });
    } else {
      success('Connection restored. Syncing data...', {
        title: 'Back Online',
        context: 'network_online',
        duration: 4000
      });
      // Auto-refresh data when back online
      loadDataWithToast();
    }
  }, [error, success, loadDataWithToast]);

  // Connection quality warnings
  const showConnectionQualityWarning = useCallback((quality: string) => {
    if (quality === 'poor') {
      warning('Slow connection detected. Some operations may take longer.', {
        title: 'Connection Quality',
        context: 'connection_quality',
        duration: 8000,
        actions: [
          {
            label: 'Tips for Slow Connections',
            onClick: () => {
              info('Try refreshing the page, closing other browser tabs, or moving closer to your WiFi router.');
            },
            color: 'info'
          }
        ]
      });
    }
  }, [warning, info]);

  // Show error toast for general errors
  const showErrorToast = useCallback((err: any, context: string) => {
    error(err.userMessage || `Failed to ${context}`, {
      title: 'Error',
      context: `error_${context}`,
      duration: 0,
      actions: err.isRetryable ? [
        {
          label: 'Retry',
          onClick: () => {
            // This would need to be customized per operation
            loadDataWithToast();
          },
          color: 'primary'
        }
      ] : [
        {
          label: 'Contact Support',
          onClick: () => {
            info('Please contact support for assistance with this issue.');
          },
          color: 'secondary'
        }
      ]
    });
  }, [error, info, loadDataWithToast]);

  return {
    // All original data and functions
    ...instructorData,
    
    // Enhanced functions with toast feedback
    addAvailability: addAvailabilityWithToast,
    removeAvailability: removeAvailabilityWithToast,
    updateAttendance: updateAttendanceWithToast,
    completeClass: completeClassWithToast,
    loadData: loadDataWithToast,
    
    // Network status helpers
    showNetworkStatusToast,
    showConnectionQualityWarning,
    showErrorToast,
    
    // Network status
    isOnline,
    connectionQuality
  };
}; 