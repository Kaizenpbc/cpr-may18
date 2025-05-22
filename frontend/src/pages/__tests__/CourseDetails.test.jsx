import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import CourseDetails from '../CourseDetails';
import { api } from '../../api/config';

// Mock the API module
vi.mock('../../api/config', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockCourse = {
  id: 1,
  name: 'Basic Life Support (BLS)',
  description: 'Learn essential CPR and AED skills for healthcare providers and first responders.',
  duration: '4 hours',
  price: 99.99,
  level: 'Basic',
  prerequisites: ['None'],
  objectives: [
    'Perform high-quality CPR',
    'Use an AED effectively',
    'Provide basic life support',
  ],
  materials: [
    'CPR manikin',
    'AED trainer',
    'Course manual',
  ],
  instructor: {
    id: 1,
    name: 'John Doe',
    specialization: 'BLS',
    experience: '10 years',
  },
};

const mockSessions = [
  {
    id: 1,
    startDate: '2024-05-20T09:00:00',
    endDate: '2024-05-20T13:00:00',
    location: 'Training Center A',
    capacity: 12,
    enrolledCount: 8,
    status: 'scheduled',
  },
  {
    id: 2,
    startDate: '2024-05-25T09:00:00',
    endDate: '2024-05-25T13:00:00',
    location: 'Training Center B',
    capacity: 8,
    enrolledCount: 6,
    status: 'scheduled',
  },
];

const renderCourseDetails = (courseId = '1') => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<CourseDetails />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('CourseDetails Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders course title', () => {
      api.get.mockResolvedValue({ data: mockCourse });
      renderCourseDetails();

      expect(screen.getByText('Course Details')).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
      api.get.mockImplementation(() => new Promise(() => {}));
      renderCourseDetails();
      expect(screen.getByText('Loading course details...')).toBeInTheDocument();
    });

    it('displays course information when data is loaded', async () => {
      api.get.mockResolvedValue({ data: mockCourse });
      renderCourseDetails();

      await waitFor(() => {
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
        expect(screen.getByText('Learn essential CPR and AED skills for healthcare providers and first responders.')).toBeInTheDocument();
      });
    });
  });

  describe('Course Information', () => {
    it('displays all course details correctly', async () => {
      api.get.mockResolvedValue({ data: mockCourse });
      renderCourseDetails();

      await waitFor(() => {
        // Basic information
        expect(screen.getByText('Duration: 4 hours')).toBeInTheDocument();
        expect(screen.getByText('Price: $99.99')).toBeInTheDocument();
        expect(screen.getByText('Level: Basic')).toBeInTheDocument();

        // Prerequisites
        expect(screen.getByText('Prerequisites')).toBeInTheDocument();
        expect(screen.getByText('None')).toBeInTheDocument();

        // Objectives
        expect(screen.getByText('Learning Objectives')).toBeInTheDocument();
        expect(screen.getByText('Perform high-quality CPR')).toBeInTheDocument();
        expect(screen.getByText('Use an AED effectively')).toBeInTheDocument();
        expect(screen.getByText('Provide basic life support')).toBeInTheDocument();

        // Materials
        expect(screen.getByText('Course Materials')).toBeInTheDocument();
        expect(screen.getByText('CPR manikin')).toBeInTheDocument();
        expect(screen.getByText('AED trainer')).toBeInTheDocument();
        expect(screen.getByText('Course manual')).toBeInTheDocument();

        // Instructor
        expect(screen.getByText('Instructor')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Specialization: BLS')).toBeInTheDocument();
        expect(screen.getByText('Experience: 10 years')).toBeInTheDocument();
      });
    });
  });

  describe('Available Sessions', () => {
    it('displays available sessions', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourse })
        .mockResolvedValueOnce({ data: mockSessions });
      renderCourseDetails();

      await waitFor(() => {
        expect(screen.getByText('Available Sessions')).toBeInTheDocument();
        expect(screen.getByText('May 20, 2024')).toBeInTheDocument();
        expect(screen.getByText('May 25, 2024')).toBeInTheDocument();
      });
    });

    it('shows session details correctly', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourse })
        .mockResolvedValueOnce({ data: mockSessions });
      renderCourseDetails();

      await waitFor(() => {
        // First session
        expect(screen.getByText('Training Center A')).toBeInTheDocument();
        expect(screen.getByText('9:00 AM - 1:00 PM')).toBeInTheDocument();
        expect(screen.getByText('8/12 enrolled')).toBeInTheDocument();

        // Second session
        expect(screen.getByText('Training Center B')).toBeInTheDocument();
        expect(screen.getByText('9:00 AM - 1:00 PM')).toBeInTheDocument();
        expect(screen.getByText('6/8 enrolled')).toBeInTheDocument();
      });
    });
  });

  describe('Enrollment Process', () => {
    it('shows enroll button for available sessions', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourse })
        .mockResolvedValueOnce({ data: mockSessions });
      renderCourseDetails();

      await waitFor(() => {
        expect(screen.getAllByText('Enroll Now')).toHaveLength(2);
      });
    });

    it('initiates enrollment process when clicking enroll button', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourse })
        .mockResolvedValueOnce({ data: mockSessions });
      api.post.mockResolvedValue({ data: { success: true } });
      renderCourseDetails();

      await waitFor(() => {
        expect(screen.getAllByText('Enroll Now')[0]).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('Enroll Now')[0]);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/enrollments', { sessionId: 1 });
        expect(screen.getByText('Successfully enrolled in course')).toBeInTheDocument();
      });
    });

    it('handles enrollment error', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourse })
        .mockResolvedValueOnce({ data: mockSessions });
      api.post.mockRejectedValue(new Error('Enrollment failed'));
      renderCourseDetails();

      await waitFor(() => {
        expect(screen.getAllByText('Enroll Now')[0]).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('Enroll Now')[0]);

      await waitFor(() => {
        expect(screen.getByText('Failed to enroll in course')).toBeInTheDocument();
      });
    });
  });

  describe('Session Filtering', () => {
    it('filters sessions by date', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourse })
        .mockResolvedValueOnce({ data: mockSessions });
      renderCourseDetails();

      await waitFor(() => {
        expect(screen.getByText('May 20, 2024')).toBeInTheDocument();
        expect(screen.getByText('May 25, 2024')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Filter by date'));
      fireEvent.click(screen.getByText('Next 7 days'));

      await waitFor(() => {
        expect(screen.getByText('May 20, 2024')).toBeInTheDocument();
        expect(screen.queryByText('May 25, 2024')).not.toBeInTheDocument();
      });
    });

    it('filters sessions by location', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourse })
        .mockResolvedValueOnce({ data: mockSessions });
      renderCourseDetails();

      await waitFor(() => {
        expect(screen.getByText('Training Center A')).toBeInTheDocument();
        expect(screen.getByText('Training Center B')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Filter by location'));
      fireEvent.click(screen.getByText('Training Center A'));

      await waitFor(() => {
        expect(screen.getByText('Training Center A')).toBeInTheDocument();
        expect(screen.queryByText('Training Center B')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API error gracefully', async () => {
      const errorMessage = 'Failed to load course details';
      api.get.mockRejectedValue(new Error(errorMessage));
      renderCourseDetails();

      await waitFor(() => {
        expect(screen.getByText(/error loading course details/i)).toBeInTheDocument();
      });
    });

    it('shows error message when no sessions are available', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourse })
        .mockResolvedValueOnce({ data: [] });
      renderCourseDetails();

      await waitFor(() => {
        expect(screen.getByText('No sessions available')).toBeInTheDocument();
        expect(screen.getByText('Please check back later for new sessions.')).toBeInTheDocument();
      });
    });
  });
}); 