import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import InstructorDashboard from '../InstructorDashboard';
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

const mockInstructor = {
  id: 1,
  name: 'John Doe',
  specialization: 'BLS',
  experience: '10 years',
  rating: 4.8,
  totalStudents: 150,
  completedSessions: 45,
};

const mockUpcomingSessions = [
  {
    id: 1,
    courseId: 1,
    courseName: 'Basic Life Support (BLS)',
    startDate: '2024-05-20T09:00:00',
    endDate: '2024-05-20T13:00:00',
    location: 'Training Center A',
    capacity: 12,
    enrolledCount: 8,
    status: 'scheduled',
  },
  {
    id: 2,
    courseId: 2,
    courseName: 'Advanced Cardiac Life Support (ACLS)',
    startDate: '2024-05-25T09:00:00',
    endDate: '2024-05-25T17:00:00',
    location: 'Training Center B',
    capacity: 8,
    enrolledCount: 6,
    status: 'scheduled',
  },
];

const mockRecentStudents = [
  {
    id: 1,
    name: 'Alice Smith',
    course: 'Basic Life Support (BLS)',
    sessionDate: '2024-05-15',
    status: 'completed',
  },
  {
    id: 2,
    name: 'Bob Johnson',
    course: 'Advanced Cardiac Life Support (ACLS)',
    sessionDate: '2024-05-18',
    status: 'enrolled',
  },
];

const renderInstructorDashboard = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <InstructorDashboard />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('InstructorDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders dashboard title', () => {
      renderInstructorDashboard();
      expect(screen.getByText('Instructor Dashboard')).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
      api.get.mockImplementation(() => new Promise(() => {}));
      renderInstructorDashboard();
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });

    it('displays instructor information when data is loaded', async () => {
      api.get.mockResolvedValue({ data: mockInstructor });
      renderInstructorDashboard();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('BLS Specialist')).toBeInTheDocument();
      });
    });
  });

  describe('Statistics Display', () => {
    it('shows instructor statistics correctly', async () => {
      api.get.mockResolvedValue({ data: mockInstructor });
      renderInstructorDashboard();

      await waitFor(() => {
        expect(screen.getByText('Total Students')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('Completed Sessions')).toBeInTheDocument();
        expect(screen.getByText('45')).toBeInTheDocument();
        expect(screen.getByText('Rating')).toBeInTheDocument();
        expect(screen.getByText('4.8')).toBeInTheDocument();
      });
    });
  });

  describe('Upcoming Sessions', () => {
    it('displays upcoming sessions', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockInstructor })
        .mockResolvedValueOnce({ data: mockUpcomingSessions });
      renderInstructorDashboard();

      await waitFor(() => {
        expect(screen.getByText('Upcoming Sessions')).toBeInTheDocument();
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
        expect(screen.getByText('Advanced Cardiac Life Support (ACLS)')).toBeInTheDocument();
      });
    });

    it('shows session details correctly', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockInstructor })
        .mockResolvedValueOnce({ data: mockUpcomingSessions });
      renderInstructorDashboard();

      await waitFor(() => {
        // First session
        expect(screen.getByText('May 20, 2024')).toBeInTheDocument();
        expect(screen.getByText('Training Center A')).toBeInTheDocument();
        expect(screen.getByText('8/12 enrolled')).toBeInTheDocument();

        // Second session
        expect(screen.getByText('May 25, 2024')).toBeInTheDocument();
        expect(screen.getByText('Training Center B')).toBeInTheDocument();
        expect(screen.getByText('6/8 enrolled')).toBeInTheDocument();
      });
    });

    it('allows canceling a session', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockInstructor })
        .mockResolvedValueOnce({ data: mockUpcomingSessions });
      api.put.mockResolvedValue({ data: { success: true } });
      renderInstructorDashboard();

      await waitFor(() => {
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel Session'));

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/sessions/1/cancel');
        expect(screen.getByText('Session cancelled successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Recent Students', () => {
    it('displays recent students', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockInstructor })
        .mockResolvedValueOnce({ data: mockUpcomingSessions })
        .mockResolvedValueOnce({ data: mockRecentStudents });
      renderInstructorDashboard();

      await waitFor(() => {
        expect(screen.getByText('Recent Students')).toBeInTheDocument();
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    it('shows student details correctly', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockInstructor })
        .mockResolvedValueOnce({ data: mockUpcomingSessions })
        .mockResolvedValueOnce({ data: mockRecentStudents });
      renderInstructorDashboard();

      await waitFor(() => {
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
        expect(screen.getByText('May 15, 2024')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Advanced Cardiac Life Support (ACLS)')).toBeInTheDocument();
        expect(screen.getByText('May 18, 2024')).toBeInTheDocument();
        expect(screen.getByText('Enrolled')).toBeInTheDocument();
      });
    });
  });

  describe('Session Management', () => {
    it('allows creating a new session', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockInstructor })
        .mockResolvedValueOnce({ data: mockUpcomingSessions });
      api.post.mockResolvedValue({ data: { success: true } });
      renderInstructorDashboard();

      await waitFor(() => {
        expect(screen.getByText('Create New Session')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create New Session'));

      // Fill in session details
      fireEvent.change(screen.getByLabelText('Course'), { target: { value: '1' } });
      fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2024-06-01' } });
      fireEvent.change(screen.getByLabelText('Start Time'), { target: { value: '09:00' } });
      fireEvent.change(screen.getByLabelText('End Time'), { target: { value: '13:00' } });
      fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Training Center A' } });
      fireEvent.change(screen.getByLabelText('Capacity'), { target: { value: '12' } });

      fireEvent.click(screen.getByText('Create Session'));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/sessions', expect.any(Object));
        expect(screen.getByText('Session created successfully')).toBeInTheDocument();
      });
    });

    it('validates session creation form', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockInstructor })
        .mockResolvedValueOnce({ data: mockUpcomingSessions });
      renderInstructorDashboard();

      await waitFor(() => {
        expect(screen.getByText('Create New Session')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create New Session'));
      fireEvent.click(screen.getByText('Create Session'));

      await waitFor(() => {
        expect(screen.getByText('Course is required')).toBeInTheDocument();
        expect(screen.getByText('Date is required')).toBeInTheDocument();
        expect(screen.getByText('Start time is required')).toBeInTheDocument();
        expect(screen.getByText('End time is required')).toBeInTheDocument();
        expect(screen.getByText('Location is required')).toBeInTheDocument();
        expect(screen.getByText('Capacity is required')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API error gracefully', async () => {
      const errorMessage = 'Failed to load dashboard';
      api.get.mockRejectedValue(new Error(errorMessage));
      renderInstructorDashboard();

      await waitFor(() => {
        expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument();
      });
    });

    it('shows empty state when no upcoming sessions', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockInstructor })
        .mockResolvedValueOnce({ data: [] });
      renderInstructorDashboard();

      await waitFor(() => {
        expect(screen.getByText('No upcoming sessions')).toBeInTheDocument();
        expect(screen.getByText('Create a new session to get started.')).toBeInTheDocument();
      });
    });
  });
}); 