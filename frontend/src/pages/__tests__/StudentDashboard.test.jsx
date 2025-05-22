import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import StudentDashboard from '../StudentDashboard';
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

const mockStudent = {
  id: 1,
  name: 'John Doe',
  email: 'john.doe@example.com',
  role: 'student',
  enrolledCourses: 3,
  completedCourses: 2,
  activeCertifications: 2,
};

const mockEnrollments = [
  {
    id: 1,
    courseId: 1,
    courseName: 'Basic Life Support (BLS)',
    sessionId: 1,
    sessionDate: '2024-05-20T09:00:00',
    status: 'enrolled',
    instructor: 'Jane Smith',
    location: 'Training Center A',
  },
  {
    id: 2,
    courseId: 2,
    courseName: 'Advanced Cardiac Life Support (ACLS)',
    sessionId: 2,
    sessionDate: '2024-05-25T09:00:00',
    status: 'completed',
    instructor: 'Mike Johnson',
    location: 'Training Center B',
  },
];

const mockCertifications = [
  {
    id: 1,
    courseName: 'Basic Life Support (BLS)',
    issueDate: '2024-01-15',
    expirationDate: '2025-01-15',
    status: 'active',
    certificationNumber: 'BLS-2024-001',
  },
  {
    id: 2,
    courseName: 'Advanced Cardiac Life Support (ACLS)',
    issueDate: '2024-02-01',
    expirationDate: '2025-02-01',
    status: 'active',
    certificationNumber: 'ACLS-2024-001',
  },
];

const renderStudentDashboard = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <StudentDashboard />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('StudentDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders dashboard title', () => {
      renderStudentDashboard();
      expect(screen.getByText('Student Dashboard')).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
      api.get.mockImplementation(() => new Promise(() => {}));
      renderStudentDashboard();
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });

    it('displays student information when data is loaded', async () => {
      api.get.mockResolvedValue({ data: mockStudent });
      renderStudentDashboard();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      });
    });
  });

  describe('Statistics Display', () => {
    it('shows student statistics correctly', async () => {
      api.get.mockResolvedValue({ data: mockStudent });
      renderStudentDashboard();

      await waitFor(() => {
        expect(screen.getByText('Enrolled Courses')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Completed Courses')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('Active Certifications')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });
  });

  describe('Enrollment History', () => {
    it('displays enrollment history', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockStudent })
        .mockResolvedValueOnce({ data: mockEnrollments });
      renderStudentDashboard();

      await waitFor(() => {
        expect(screen.getByText('Enrollment History')).toBeInTheDocument();
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
        expect(screen.getByText('Advanced Cardiac Life Support (ACLS)')).toBeInTheDocument();
      });
    });

    it('shows enrollment details correctly', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockStudent })
        .mockResolvedValueOnce({ data: mockEnrollments });
      renderStudentDashboard();

      await waitFor(() => {
        // First enrollment
        expect(screen.getByText('May 20, 2024')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Training Center A')).toBeInTheDocument();
        expect(screen.getByText('Enrolled')).toBeInTheDocument();

        // Second enrollment
        expect(screen.getByText('May 25, 2024')).toBeInTheDocument();
        expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
        expect(screen.getByText('Training Center B')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
      });
    });

    it('allows canceling an enrollment', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockStudent })
        .mockResolvedValueOnce({ data: mockEnrollments });
      api.put.mockResolvedValue({ data: { success: true } });
      renderStudentDashboard();

      await waitFor(() => {
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel Enrollment'));

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/enrollments/1/cancel');
        expect(screen.getByText('Enrollment cancelled successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Certifications', () => {
    it('displays certifications', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockStudent })
        .mockResolvedValueOnce({ data: mockEnrollments })
        .mockResolvedValueOnce({ data: mockCertifications });
      renderStudentDashboard();

      await waitFor(() => {
        expect(screen.getByText('My Certifications')).toBeInTheDocument();
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
        expect(screen.getByText('Advanced Cardiac Life Support (ACLS)')).toBeInTheDocument();
      });
    });

    it('shows certification details correctly', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockStudent })
        .mockResolvedValueOnce({ data: mockEnrollments })
        .mockResolvedValueOnce({ data: mockCertifications });
      renderStudentDashboard();

      await waitFor(() => {
        expect(screen.getByText('BLS-2024-001')).toBeInTheDocument();
        expect(screen.getByText('Issued: Jan 15, 2024')).toBeInTheDocument();
        expect(screen.getByText('Expires: Jan 15, 2025')).toBeInTheDocument();
        expect(screen.getByText('ACLS-2024-001')).toBeInTheDocument();
        expect(screen.getByText('Issued: Feb 1, 2024')).toBeInTheDocument();
        expect(screen.getByText('Expires: Feb 1, 2025')).toBeInTheDocument();
      });
    });

    it('allows downloading certification PDF', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockStudent })
        .mockResolvedValueOnce({ data: mockEnrollments })
        .mockResolvedValueOnce({ data: mockCertifications });
      api.get.mockResolvedValueOnce({ data: new Blob(['pdf content'], { type: 'application/pdf' }) });
      renderStudentDashboard();

      await waitFor(() => {
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Download PDF'));

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/certifications/1/pdf');
      });
    });
  });

  describe('Upcoming Sessions', () => {
    it('displays upcoming sessions', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockStudent })
        .mockResolvedValueOnce({ data: mockEnrollments })
        .mockResolvedValueOnce({ data: mockCertifications })
        .mockResolvedValueOnce({ data: [mockEnrollments[0]] });
      renderStudentDashboard();

      await waitFor(() => {
        expect(screen.getByText('Upcoming Sessions')).toBeInTheDocument();
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
        expect(screen.getByText('May 20, 2024')).toBeInTheDocument();
        expect(screen.getByText('Training Center A')).toBeInTheDocument();
      });
    });

    it('allows viewing session details', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockStudent })
        .mockResolvedValueOnce({ data: mockEnrollments })
        .mockResolvedValueOnce({ data: mockCertifications })
        .mockResolvedValueOnce({ data: [mockEnrollments[0]] });
      renderStudentDashboard();

      await waitFor(() => {
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('View Details'));

      await waitFor(() => {
        expect(screen.getByText('Session Details')).toBeInTheDocument();
        expect(screen.getByText('Instructor: Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Location: Training Center A')).toBeInTheDocument();
        expect(screen.getByText('Time: 9:00 AM - 1:00 PM')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API error gracefully', async () => {
      const errorMessage = 'Failed to load dashboard';
      api.get.mockRejectedValue(new Error(errorMessage));
      renderStudentDashboard();

      await waitFor(() => {
        expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument();
      });
    });

    it('shows empty state when no enrollments exist', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockStudent })
        .mockResolvedValueOnce({ data: [] });
      renderStudentDashboard();

      await waitFor(() => {
        expect(screen.getByText('No enrollments found')).toBeInTheDocument();
        expect(screen.getByText('Browse available courses to get started.')).toBeInTheDocument();
      });
    });

    it('shows empty state when no certifications exist', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockStudent })
        .mockResolvedValueOnce({ data: mockEnrollments })
        .mockResolvedValueOnce({ data: [] });
      renderStudentDashboard();

      await waitFor(() => {
        expect(screen.getByText('No certifications found')).toBeInTheDocument();
        expect(screen.getByText('Complete courses to earn certifications.')).toBeInTheDocument();
      });
    });
  });
}); 