import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import Sessions from '../Sessions';
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

const mockSessions = [
  {
    id: 1,
    courseId: 1,
    courseName: 'Basic Life Support (BLS)',
    instructorId: 1,
    instructorName: 'John Doe',
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
    instructorId: 2,
    instructorName: 'Jane Smith',
    startDate: '2024-05-25T09:00:00',
    endDate: '2024-05-25T17:00:00',
    location: 'Training Center B',
    capacity: 8,
    enrolledCount: 6,
    status: 'scheduled',
  },
];

const mockInstructors = [
  { id: 1, name: 'John Doe', specialization: 'BLS' },
  { id: 2, name: 'Jane Smith', specialization: 'ACLS' },
];

const renderSessions = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Sessions />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Sessions Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders sessions list title', () => {
      renderSessions();
      expect(screen.getByText('Training Sessions')).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
      api.get.mockImplementation(() => new Promise(() => {}));
      renderSessions();
      expect(screen.getByText('Loading sessions...')).toBeInTheDocument();
    });

    it('displays sessions when data is loaded', async () => {
      api.get.mockResolvedValue({ data: mockSessions });
      renderSessions();

      await waitFor(() => {
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
        expect(screen.getByText('Advanced Cardiac Life Support (ACLS)')).toBeInTheDocument();
      });
    });
  });

  describe('Session Details', () => {
    it('displays session information correctly', async () => {
      api.get.mockResolvedValue({ data: mockSessions });
      renderSessions();

      await waitFor(() => {
        // Check first session details
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Training Center A')).toBeInTheDocument();
        expect(screen.getByText('May 20, 2024')).toBeInTheDocument();
        expect(screen.getByText('9:00 AM - 1:00 PM')).toBeInTheDocument();
        expect(screen.getByText('8/12 enrolled')).toBeInTheDocument();

        // Check second session details
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Training Center B')).toBeInTheDocument();
        expect(screen.getByText('May 25, 2024')).toBeInTheDocument();
        expect(screen.getByText('9:00 AM - 5:00 PM')).toBeInTheDocument();
        expect(screen.getByText('6/8 enrolled')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering and Sorting', () => {
    it('filters sessions by course', async () => {
      api.get.mockResolvedValue({ data: mockSessions });
      renderSessions();

      await waitFor(() => {
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
        expect(screen.getByText('Advanced Cardiac Life Support (ACLS)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Filter by course'));
      fireEvent.click(screen.getByText('Basic Life Support (BLS)'));

      await waitFor(() => {
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
        expect(screen.queryByText('Advanced Cardiac Life Support (ACLS)')).not.toBeInTheDocument();
      });
    });

    it('filters sessions by instructor', async () => {
      api.get.mockResolvedValue({ data: mockSessions });
      renderSessions();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Filter by instructor'));
      fireEvent.click(screen.getByText('John Doe'));

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('sorts sessions by date', async () => {
      api.get.mockResolvedValue({ data: mockSessions });
      renderSessions();

      await waitFor(() => {
        const sessionCards = screen.getAllByTestId('session-card');
        expect(sessionCards[0]).toHaveTextContent('May 20');
        expect(sessionCards[1]).toHaveTextContent('May 25');
      });

      fireEvent.click(screen.getByLabelText('Sort by'));
      fireEvent.click(screen.getByText('Date: Latest First'));

      await waitFor(() => {
        const sessionCards = screen.getAllByTestId('session-card');
        expect(sessionCards[0]).toHaveTextContent('May 25');
        expect(sessionCards[1]).toHaveTextContent('May 20');
      });
    });
  });

  describe('Session Management', () => {
    it('shows session details modal when clicking on a session', async () => {
      api.get.mockResolvedValue({ data: mockSessions });
      renderSessions();

      await waitFor(() => {
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Basic Life Support (BLS)'));

      await waitFor(() => {
        expect(screen.getByText('Session Details')).toBeInTheDocument();
        expect(screen.getByText('Instructor: John Doe')).toBeInTheDocument();
        expect(screen.getByText('Location: Training Center A')).toBeInTheDocument();
        expect(screen.getByText('Date: May 20, 2024')).toBeInTheDocument();
        expect(screen.getByText('Time: 9:00 AM - 1:00 PM')).toBeInTheDocument();
        expect(screen.getByText('Capacity: 8/12')).toBeInTheDocument();
      });
    });

    it('allows booking a session', async () => {
      api.get.mockResolvedValue({ data: mockSessions });
      api.post.mockResolvedValue({ data: { success: true } });
      renderSessions();

      await waitFor(() => {
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Book Now'));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/bookings', { sessionId: 1 });
        expect(screen.getByText('Successfully booked session')).toBeInTheDocument();
      });
    });

    it('handles booking error', async () => {
      api.get.mockResolvedValue({ data: mockSessions });
      api.post.mockRejectedValue(new Error('Booking failed'));
      renderSessions();

      await waitFor(() => {
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Book Now'));

      await waitFor(() => {
        expect(screen.getByText('Failed to book session')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API error gracefully', async () => {
      const errorMessage = 'Failed to load sessions';
      api.get.mockRejectedValue(new Error(errorMessage));
      renderSessions();

      await waitFor(() => {
        expect(screen.getByText(/error loading sessions/i)).toBeInTheDocument();
      });
    });

    it('shows error message when session is full', async () => {
      const fullSession = {
        ...mockSessions[0],
        enrolledCount: mockSessions[0].capacity,
      };
      api.get.mockResolvedValue({ data: [fullSession] });
      renderSessions();

      await waitFor(() => {
        expect(screen.getByText('Session Full')).toBeInTheDocument();
        expect(screen.queryByText('Book Now')).not.toBeInTheDocument();
      });
    });
  });

  describe('Calendar View', () => {
    it('switches to calendar view', async () => {
      api.get.mockResolvedValue({ data: mockSessions });
      renderSessions();

      await waitFor(() => {
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('View as calendar'));

      await waitFor(() => {
        expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
        expect(screen.getByText('May 2024')).toBeInTheDocument();
      });
    });

    it('displays sessions on calendar', async () => {
      api.get.mockResolvedValue({ data: mockSessions });
      renderSessions();

      fireEvent.click(screen.getByLabelText('View as calendar'));

      await waitFor(() => {
        expect(screen.getByText('20')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText('BLS')).toBeInTheDocument();
        expect(screen.getByText('ACLS')).toBeInTheDocument();
      });
    });
  });
}); 