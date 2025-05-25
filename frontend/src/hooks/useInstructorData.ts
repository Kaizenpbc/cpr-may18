import { useState, useCallback } from 'react';
import api from '../services/api';
import { 
  InstructorUser, 
  Course, 
  AvailabilitySlot, 
  CourseRequest,
  ApiResponse,
  PaginatedResponse 
} from '../types/instructor';

interface UseInstructorDataReturn {
  // State
  instructorData: InstructorUser | null;
  myClasses: Course[];
  completedClasses: Course[];
  availability: AvailabilitySlot[];
  courseRequests: CourseRequest[];
  loading: boolean;
  error: string | null;

  // Actions
  loadInstructorData: () => Promise<void>;
  loadAvailability: () => Promise<void>;
  loadClasses: () => Promise<void>;
  loadCompletedClasses: (page?: number) => Promise<void>;
  addAvailability: (date: string) => Promise<void>;
  removeAvailability: (date: string) => Promise<void>;
  completeClass: (classId: number, completionData: any) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useInstructorData = (): UseInstructorDataReturn => {
  const [instructorData, setInstructorData] = useState<InstructorUser | null>(null);
  const [myClasses, setMyClasses] = useState<Course[]>([]);
  const [completedClasses, setCompletedClasses] = useState<Course[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [courseRequests, setCourseRequests] = useState<CourseRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInstructorData = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<InstructorUser>>('/api/v1/instructor/profile');
      if (response.data.success) {
        setInstructorData(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load instructor data:', err);
      setError('Failed to load instructor data');
    }
  }, []);

  const loadAvailability = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<AvailabilitySlot[]>>('/api/v1/instructor/availability');
      if (response.data.success) {
        setAvailability(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load availability:', err);
    }
  }, []);

  const loadClasses = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<Course[]>>('/api/v1/instructor/classes');
      if (response.data.success) {
        setMyClasses(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  }, []);

  const loadCompletedClasses = useCallback(async (page = 1) => {
    try {
      const response = await api.get<PaginatedResponse<Course>>(
        `/api/v1/instructor/classes/completed?page=${page}`
      );
      if (response.data.success) {
        setCompletedClasses(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load completed classes:', err);
    }
  }, []);

  const addAvailability = useCallback(async (date: string) => {
    try {
      const response = await api.post<ApiResponse<AvailabilitySlot>>(
        '/api/v1/instructor/availability',
        { date }
      );
      if (response.data.success) {
        await loadAvailability();
      }
    } catch (err) {
      console.error('Failed to add availability:', err);
      throw err;
    }
  }, [loadAvailability]);

  const removeAvailability = useCallback(async (date: string) => {
    try {
      const response = await api.delete<ApiResponse<void>>(
        `/api/v1/instructor/availability/${date}`
      );
      if (response.data.success) {
        await loadAvailability();
      }
    } catch (err) {
      console.error('Failed to remove availability:', err);
      throw err;
    }
  }, [loadAvailability]);

  const completeClass = useCallback(async (classId: number, completionData: any) => {
    try {
      const response = await api.put<ApiResponse<Course>>(
        `/api/v1/instructor/classes/${classId}/complete`,
        completionData
      );
      if (response.data.success) {
        await Promise.all([loadClasses(), loadCompletedClasses()]);
      }
    } catch (err) {
      console.error('Failed to complete class:', err);
      throw err;
    }
  }, [loadClasses, loadCompletedClasses]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadInstructorData(),
        loadAvailability(),
        loadClasses(),
        loadCompletedClasses()
      ]);
    } catch (err) {
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [loadInstructorData, loadAvailability, loadClasses, loadCompletedClasses]);

  return {
    // State
    instructorData,
    myClasses,
    completedClasses,
    availability,
    courseRequests,
    loading,
    error,

    // Actions
    loadInstructorData,
    loadAvailability,
    loadClasses,
    loadCompletedClasses,
    addAvailability,
    removeAvailability,
    completeClass,
    refreshData
  };
}; 