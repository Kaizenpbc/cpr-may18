// Instructor Portal Type Definitions

// User and Authentication
export interface InstructorUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'instructor';
  phone?: string;
  certification_number?: string;
  certification_expiry?: string;
  created_at?: string;
  updated_at?: string;
}

// Course Types
export interface Course {
  id: number;
  course_id: number;
  course_type: string;
  course_type_id: number;
  organization_id: number;
  organization_name: string;
  location_id: number;
  location_name: string;
  address?: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  max_students: number;
  current_students: number;
  price: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  instructor_id?: number;
  instructor_name?: string;
  created_at?: string;
  updated_at?: string;
  students?: Student[];
}

// Student Types
export interface Student {
  id: number;
  student_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  attendance?: AttendanceStatus;
  payment_status?: 'paid' | 'pending' | 'partial';
  enrolled_at?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | null;

// Availability Types
export interface AvailabilitySlot {
  id: number;
  instructor_id: number;
  date: string;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

// Course Request Types
export interface CourseRequest {
  id: number;
  organization_id: number;
  organization_name: string;
  course_type: string;
  preferred_dates: string[];
  location: string;
  estimated_students: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  notes?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Form Types
export interface AttendanceFormData {
  student_id: number;
  attendance: AttendanceStatus;
  course_id: number;
}

export interface CourseCompletionData {
  course_id: number;
  completion_date: string;
  students_completed: number;
  notes?: string;
}

// State Types for useInstructorData hook
export interface InstructorDataState {
  instructorData: InstructorUser | null;
  myClasses: Course[];
  completedClasses: Course[];
  availability: AvailabilitySlot[];
  courseRequests: CourseRequest[];
  loading: boolean;
  error: string | null;
}

// Navigation Types
export type InstructorView = 
  | 'dashboard'
  | 'my-classes'
  | 'attendance'
  | 'availability'
  | 'schedule'
  | 'archive'
  | 'help';

// Calendar Event Types
export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    type: 'class' | 'availability' | 'request';
    data: Course | AvailabilitySlot | CourseRequest;
  };
}

// Combined Schedule Item for My Classes View
export interface CombinedScheduleItem {
  key?: string;
  type: 'class' | 'availability';
  displayDate: string;
  organizationname?: string;
  location?: string;
  coursenumber?: string;
  coursetypename?: string;
  studentsregistered?: number;
  studentsattendance?: number;
  notes?: string;
  status: string;
  // Original data
  course_id?: number;
  originalData?: Course | AvailabilitySlot;
} 