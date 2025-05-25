import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { tokenService } from '../services/tokenService';
import logger from '../utils/logger';

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

interface InstructorDataState {
  availableDates: Set<string>;
  scheduledClasses: ScheduledClass[];
  completedClasses: ScheduledClass[];
  loading: boolean;
  error: string | null;
}

export const useInstructorData = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [state, setState] = useState<InstructorDataState>({
    availableDates: new Set(),
    scheduledClasses: [],
    completedClasses: [],
    loading: true,
    error: null
  });

  // Load all instructor data
  const loadData = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Verify token
      const token = tokenService.getAccessToken();
      if (!token) {
        logger.error('[useInstructorData] No token available');
        await logout();
        return;
      }

      // Parallel API calls for better performance
      const [availabilityRes, classesRes, completedRes] = await Promise.all([
        api.get('/api/v1/instructor/availability'),
        api.get('/api/v1/instructor/classes'),
        api.get('/api/v1/instructor/classes/completed')
      ]);

      setState({
        availableDates: new Set((availabilityRes.data.data || []).map((avail: { date: string }) => avail.date)),
        scheduledClasses: classesRes.data.data || [],
        completedClasses: completedRes.data.data?.classes || completedRes.data.data || [],
        loading: false,
        error: null
      });

    } catch (error: any) {
      logger.error('[useInstructorData] Error loading data:', error);
      
      if (error.response?.status === 401) {
        await logout();
        return;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load instructor data'
      }));
    }
  }, [isAuthenticated, user, logout]);

  // Add availability date
  const addAvailability = useCallback(async (date: string) => {
    try {
      const response = await api.post('/api/v1/instructor/availability', { date });
      
      if (response.data.success) {
        setState(prev => ({
          ...prev,
          availableDates: new Set([...prev.availableDates, date])
        }));
        return { success: true };
      }
      
      throw new Error(response.data.message || 'Failed to add availability');
    } catch (error: any) {
      logger.error('[useInstructorData] Error adding availability:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Remove availability date
  const removeAvailability = useCallback(async (date: string) => {
    try {
      await api.delete(`/api/v1/instructor/availability/${date}`);
      
      setState(prev => {
        const newDates = new Set(prev.availableDates);
        newDates.delete(date);
        return { ...prev, availableDates: newDates };
      });
      
      return { success: true };
    } catch (error: any) {
      logger.error('[useInstructorData] Error removing availability:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Fetch students for a specific class
  const fetchClassStudents = useCallback(async (courseId: number): Promise<Student[]> => {
    try {
      const response = await api.get('/api/v1/instructor/classes/students', { 
        params: { course_id: courseId } 
      });
      return response.data || [];
    } catch (error: any) {
      logger.error('[useInstructorData] Error fetching students:', error);
      throw error;
    }
  }, []);

  // Update student attendance
  const updateAttendance = useCallback(async (studentId: number, attendance: boolean) => {
    try {
      await api.post('/api/v1/instructor/classes/students/attendance', { 
        student_id: studentId, 
        attendance 
      });
      
      // Reload classes to get updated attendance counts
      await loadData();
      
      return { success: true };
    } catch (error: any) {
      logger.error('[useInstructorData] Error updating attendance:', error);
      return { success: false, error: error.message };
    }
  }, [loadData]);

  // Mark class as complete
  const completeClass = useCallback(async (courseId: number) => {
    try {
      const response = await api.put(`/api/v1/instructor/classes/${courseId}/complete`, {
        generateCertificates: false
      });

      if (response.data.success) {
        await loadData(); // Refresh all data
        return { 
          success: true, 
          studentsAttended: response.data.data.students_attended 
        };
      }

      throw new Error(response.data.message || 'Failed to complete class');
    } catch (error: any) {
      logger.error('[useInstructorData] Error completing class:', error);
      
      // Provide specific error messages
      if (error.response?.status === 400 && error.response.data.message.includes('attendance')) {
        return { 
          success: false, 
          error: 'Please mark attendance for all students before completing the class.' 
        };
      }
      
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }, [loadData]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    ...state,
    loadData,
    addAvailability,
    removeAvailability,
    fetchClassStudents,
    updateAttendance,
    completeClass
  };
}; 