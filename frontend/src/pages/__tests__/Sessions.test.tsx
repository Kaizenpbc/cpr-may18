import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { AuthProvider } from '../../contexts/AuthContext';
import Sessions from '../Sessions';
import { sessionsApi } from '../../services/api';

// Mock the API module
vi.mock('../../services/api', () => ({
  sessionsApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    enroll: vi.fn(),
    cancel: vi.fn(),
  },
}));

// Mock data
const mockSessions = [
  {
    id: 1,
    courseId: 1,
    courseTitle: 'Basic CPR',
    startDate: '2024-05-01',
    endDate: '2024-05-02',
    location: 'Room 101',
    instructor: 'John Doe',
    status: 'upcoming',
    capacity: 20,
    enrolled: 15,
  },
  {
    id: 2,
    courseId: 2,
    courseTitle: 'Advanced First Aid',
    startDate: '2024-05-03',
    endDate: '2024-05-04',
    location: 'Room 102',
    instructor: 'Jane Smith',
    status: 'in-progress',
    capacity: 15,
    enrolled: 15,
  },
  {
    id: 3,
    courseId: 3,
    courseTitle: 'Emergency Response',
    startDate: '2024-05-05',
    endDate: '2024-05-06',
    location: 'Room 103',
    instructor: 'Mike Johnson',
    status: 'completed',
    capacity: 25,
    enrolled: 20,
  },
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderSessions = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Sessions />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Sessions Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (sessionsApi.getAll as any).mockResolvedValue({ data: mockSessions });
  });

  describe('Initial Rendering', () => {
    it('renders the sessions page title', () => {
      renderSessions();
      expect(screen.getByText('Sessions')).toBeInTheDocument();
    });

    it('displays a loading state while fetching sessions', () => {
      renderSessions();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('displays the sessions list after loading', async () => {
      renderSessions();
      await waitFor(() => {
        expect(screen.getByText('Basic CPR')).toBeInTheDocument();
        expect(screen.getByText('Advanced First Aid')).toBeInTheDocument();
        expect(screen.getByText('Emergency Response')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('filters sessions based on search query', async () => {
      renderSessions();
      await waitFor(() => {
        expect(screen.getByText('Basic CPR')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search sessions...');
      fireEvent.change(searchInput, { target: { value: 'Basic' } });

      expect(screen.getByText('Basic CPR')).toBeInTheDocument();
      expect(screen.queryByText('Advanced First Aid')).not.toBeInTheDocument();
    });

    it('filters sessions based on status', async () => {
      renderSessions();
      await waitFor(() => {
        expect(screen.getByText('Basic CPR')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('Status');
      fireEvent.mouseDown(statusSelect);
      fireEvent.click(screen.getByText('upcoming'));

      expect(screen.getByText('Basic CPR')).toBeInTheDocument();
      expect(screen.queryByText('Advanced First Aid')).not.toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('sorts sessions by start date', async () => {
      renderSessions();
      await waitFor(() => {
        expect(screen.getByText('Basic CPR')).toBeInTheDocument();
      });

      const sortButton = screen.getByTitle('Sort by Date');
      fireEvent.click(sortButton);

      const sessions = screen.getAllByRole('heading', { level: 6 });
      expect(sessions[0]).toHaveTextContent('Basic CPR');
    });

    it('sorts sessions by course title', async () => {
      renderSessions();
      await waitFor(() => {
        expect(screen.getByText('Basic CPR')).toBeInTheDocument();
      });

      const sortButton = screen.getByTitle('Sort by Course');
      fireEvent.click(sortButton);

      const sessions = screen.getAllByRole('heading', { level: 6 });
      expect(sessions[0]).toHaveTextContent('Advanced First Aid');
    });
  });

  describe('Session Dialog', () => {
    it('opens dialog when clicking Add Session', async () => {
      renderSessions();
      await waitFor(() => {
        expect(screen.getByText('Add Session')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Session'));
      expect(screen.getByText('Add New Session')).toBeInTheDocument();
    });

    it('opens dialog with session details when clicking View Details', async () => {
      renderSessions();
      await waitFor(() => {
        expect(screen.getByText('View Details')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('View Details')[0]);
      expect(screen.getByText('Session Details')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Basic CPR')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles API error when fetching sessions', async () => {
      (sessionsApi.getAll as any).mockRejectedValue(new Error('API Error'));
      renderSessions();

      await waitFor(() => {
        expect(screen.queryByText('Basic CPR')).not.toBeInTheDocument();
      });
    });
  });
}); 