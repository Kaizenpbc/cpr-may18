import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import SessionForm from '../SessionForm';
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

const mockCourses = [
  { id: 1, name: 'Basic Life Support (BLS)' },
  { id: 2, name: 'Advanced Cardiac Life Support (ACLS)' },
];

const mockInstructors = [
  { id: 1, name: 'Jane Smith', specialization: 'BLS' },
  { id: 2, name: 'Mike Johnson', specialization: 'ACLS' },
];

const mockLocations = [
  { id: 1, name: 'Training Center A', capacity: 15 },
  { id: 2, name: 'Training Center B', capacity: 10 },
];

const mockSession = {
  id: 1,
  courseId: 1,
  instructorId: 1,
  locationId: 1,
  startDate: '2024-05-20T09:00:00',
  endDate: '2024-05-20T13:00:00',
  capacity: 12,
  status: 'scheduled',
};

const renderSessionForm = (props = {}) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <SessionForm {...props} />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('SessionForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders form title for new session', () => {
      renderSessionForm();
      expect(screen.getByText('Create New Session')).toBeInTheDocument();
    });

    it('renders form title for editing session', () => {
      renderSessionForm({ session: mockSession });
      expect(screen.getByText('Edit Session')).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
      api.get.mockImplementation(() => new Promise(() => {}));
      renderSessionForm();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('loads required data', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourses })
        .mockResolvedValueOnce({ data: mockInstructors })
        .mockResolvedValueOnce({ data: mockLocations });
      renderSessionForm();

      await waitFor(() => {
        expect(screen.getByLabelText('Course')).toBeInTheDocument();
        expect(screen.getByLabelText('Instructor')).toBeInTheDocument();
        expect(screen.getByLabelText('Location')).toBeInTheDocument();
      });
    });
  });

  describe('Form Fields', () => {
    it('displays all required form fields', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourses })
        .mockResolvedValueOnce({ data: mockInstructors })
        .mockResolvedValueOnce({ data: mockLocations });
      renderSessionForm();

      await waitFor(() => {
        expect(screen.getByLabelText('Course')).toBeInTheDocument();
        expect(screen.getByLabelText('Instructor')).toBeInTheDocument();
        expect(screen.getByLabelText('Location')).toBeInTheDocument();
        expect(screen.getByLabelText('Date')).toBeInTheDocument();
        expect(screen.getByLabelText('Start Time')).toBeInTheDocument();
        expect(screen.getByLabelText('End Time')).toBeInTheDocument();
        expect(screen.getByLabelText('Capacity')).toBeInTheDocument();
      });
    });

    it('pre-fills form fields when editing', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourses })
        .mockResolvedValueOnce({ data: mockInstructors })
        .mockResolvedValueOnce({ data: mockLocations });
      renderSessionForm({ session: mockSession });

      await waitFor(() => {
        expect(screen.getByLabelText('Course')).toHaveValue('1');
        expect(screen.getByLabelText('Instructor')).toHaveValue('1');
        expect(screen.getByLabelText('Location')).toHaveValue('1');
        expect(screen.getByLabelText('Date')).toHaveValue('2024-05-20');
        expect(screen.getByLabelText('Start Time')).toHaveValue('09:00');
        expect(screen.getByLabelText('End Time')).toHaveValue('13:00');
        expect(screen.getByLabelText('Capacity')).toHaveValue('12');
      });
    });
  });

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourses })
        .mockResolvedValueOnce({ data: mockInstructors })
        .mockResolvedValueOnce({ data: mockLocations });
      renderSessionForm();

      await waitFor(() => {
        expect(screen.getByText('Create Session')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create Session'));

      await waitFor(() => {
        expect(screen.getByText('Course is required')).toBeInTheDocument();
        expect(screen.getByText('Instructor is required')).toBeInTheDocument();
        expect(screen.getByText('Location is required')).toBeInTheDocument();
        expect(screen.getByText('Date is required')).toBeInTheDocument();
        expect(screen.getByText('Start time is required')).toBeInTheDocument();
        expect(screen.getByText('End time is required')).toBeInTheDocument();
        expect(screen.getByText('Capacity is required')).toBeInTheDocument();
      });
    });

    it('validates date is not in the past', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourses })
        .mockResolvedValueOnce({ data: mockInstructors })
        .mockResolvedValueOnce({ data: mockLocations });
      renderSessionForm();

      await waitFor(() => {
        expect(screen.getByLabelText('Date')).toBeInTheDocument();
      });

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      fireEvent.change(screen.getByLabelText('Date'), { target: { value: yesterdayStr } });
      fireEvent.click(screen.getByText('Create Session'));

      await waitFor(() => {
        expect(screen.getByText('Session date cannot be in the past')).toBeInTheDocument();
      });
    });

    it('validates end time is after start time', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourses })
        .mockResolvedValueOnce({ data: mockInstructors })
        .mockResolvedValueOnce({ data: mockLocations });
      renderSessionForm();

      await waitFor(() => {
        expect(screen.getByLabelText('Start Time')).toBeInTheDocument();
        expect(screen.getByLabelText('End Time')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText('Start Time'), { target: { value: '13:00' } });
      fireEvent.change(screen.getByLabelText('End Time'), { target: { value: '09:00' } });
      fireEvent.click(screen.getByText('Create Session'));

      await waitFor(() => {
        expect(screen.getByText('End time must be after start time')).toBeInTheDocument();
      });
    });

    it('validates capacity is within location limits', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourses })
        .mockResolvedValueOnce({ data: mockInstructors })
        .mockResolvedValueOnce({ data: mockLocations });
      renderSessionForm();

      await waitFor(() => {
        expect(screen.getByLabelText('Location')).toBeInTheDocument();
        expect(screen.getByLabelText('Capacity')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText('Location'), { target: { value: '1' } });
      fireEvent.change(screen.getByLabelText('Capacity'), { target: { value: '20' } });
      fireEvent.click(screen.getByText('Create Session'));

      await waitFor(() => {
        expect(screen.getByText('Capacity cannot exceed location capacity (15)')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    const validFormData = {
      courseId: '1',
      instructorId: '1',
      locationId: '1',
      date: '2024-06-01',
      startTime: '09:00',
      endTime: '13:00',
      capacity: '12',
    };

    it('submits form with valid data for new session', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourses })
        .mockResolvedValueOnce({ data: mockInstructors })
        .mockResolvedValueOnce({ data: mockLocations });
      api.post.mockResolvedValue({ data: { success: true } });
      renderSessionForm();

      await waitFor(() => {
        expect(screen.getByLabelText('Course')).toBeInTheDocument();
      });

      // Fill in form fields
      Object.entries(validFormData).forEach(([field, value]) => {
        fireEvent.change(screen.getByLabelText(field.replace(/([A-Z])/g, ' $1').trim()), {
          target: { value },
        });
      });

      fireEvent.click(screen.getByText('Create Session'));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/sessions', expect.any(Object));
        expect(screen.getByText('Session created successfully')).toBeInTheDocument();
      });
    });

    it('submits form with valid data for editing session', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourses })
        .mockResolvedValueOnce({ data: mockInstructors })
        .mockResolvedValueOnce({ data: mockLocations });
      api.put.mockResolvedValue({ data: { success: true } });
      renderSessionForm({ session: mockSession });

      await waitFor(() => {
        expect(screen.getByLabelText('Course')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText('Capacity'), { target: { value: '10' } });
      fireEvent.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/sessions/1', expect.any(Object));
        expect(screen.getByText('Session updated successfully')).toBeInTheDocument();
      });
    });

    it('handles submission error', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourses })
        .mockResolvedValueOnce({ data: mockInstructors })
        .mockResolvedValueOnce({ data: mockLocations });
      api.post.mockRejectedValue(new Error('Failed to create session'));
      renderSessionForm();

      await waitFor(() => {
        expect(screen.getByLabelText('Course')).toBeInTheDocument();
      });

      // Fill in form fields
      Object.entries(validFormData).forEach(([field, value]) => {
        fireEvent.change(screen.getByLabelText(field.replace(/([A-Z])/g, ' $1').trim()), {
          target: { value },
        });
      });

      fireEvent.click(screen.getByText('Create Session'));

      await waitFor(() => {
        expect(screen.getByText('Failed to create session')).toBeInTheDocument();
      });
    });
  });

  describe('Location Management', () => {
    it('updates capacity limit when location changes', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourses })
        .mockResolvedValueOnce({ data: mockInstructors })
        .mockResolvedValueOnce({ data: mockLocations });
      renderSessionForm();

      await waitFor(() => {
        expect(screen.getByLabelText('Location')).toBeInTheDocument();
        expect(screen.getByLabelText('Capacity')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText('Location'), { target: { value: '2' } });

      await waitFor(() => {
        expect(screen.getByText('Maximum capacity: 10')).toBeInTheDocument();
      });
    });

    it('validates capacity against new location limit', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourses })
        .mockResolvedValueOnce({ data: mockInstructors })
        .mockResolvedValueOnce({ data: mockLocations });
      renderSessionForm();

      await waitFor(() => {
        expect(screen.getByLabelText('Location')).toBeInTheDocument();
        expect(screen.getByLabelText('Capacity')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText('Location'), { target: { value: '2' } });
      fireEvent.change(screen.getByLabelText('Capacity'), { target: { value: '15' } });
      fireEvent.click(screen.getByText('Create Session'));

      await waitFor(() => {
        expect(screen.getByText('Capacity cannot exceed location capacity (10)')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API error when loading data', async () => {
      api.get.mockRejectedValue(new Error('Failed to load data'));
      renderSessionForm();

      await waitFor(() => {
        expect(screen.getByText(/error loading data/i)).toBeInTheDocument();
      });
    });

    it('handles validation error for overlapping sessions', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockCourses })
        .mockResolvedValueOnce({ data: mockInstructors })
        .mockResolvedValueOnce({ data: mockLocations });
      api.post.mockRejectedValue(new Error('Session overlaps with existing session'));
      renderSessionForm();

      await waitFor(() => {
        expect(screen.getByLabelText('Course')).toBeInTheDocument();
      });

      // Fill in form fields
      Object.entries(validFormData).forEach(([field, value]) => {
        fireEvent.change(screen.getByLabelText(field.replace(/([A-Z])/g, ' $1').trim()), {
          target: { value },
        });
      });

      fireEvent.click(screen.getByText('Create Session'));

      await waitFor(() => {
        expect(screen.getByText('Session overlaps with existing session')).toBeInTheDocument();
      });
    });
  });
}); 