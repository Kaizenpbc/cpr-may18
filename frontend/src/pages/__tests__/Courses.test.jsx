import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import Courses from '../Courses';
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
  {
    id: 1,
    name: 'Basic Life Support (BLS)',
    description: 'Learn essential CPR and AED skills',
    duration: '4 hours',
    price: 99.99,
    level: 'Basic',
  },
  {
    id: 2,
    name: 'Advanced Cardiac Life Support (ACLS)',
    description: 'Advanced training for healthcare providers',
    duration: '8 hours',
    price: 199.99,
    level: 'Advanced',
  },
];

const renderCourses = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Courses />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Courses Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders course list title', () => {
    renderCourses();
    expect(screen.getByText('Available Courses')).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    renderCourses();
    expect(screen.getByText('Loading courses...')).toBeInTheDocument();
  });

  it('displays courses when data is loaded', async () => {
    api.get.mockResolvedValue({ data: mockCourses });
    renderCourses();

    await waitFor(() => {
      expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
      expect(screen.getByText('Advanced Cardiac Life Support (ACLS)')).toBeInTheDocument();
    });
  });

  it('displays course details correctly', async () => {
    api.get.mockResolvedValue({ data: mockCourses });
    renderCourses();

    await waitFor(() => {
      // Check first course details
      expect(screen.getByText('Learn essential CPR and AED skills')).toBeInTheDocument();
      expect(screen.getByText('4 hours')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
      expect(screen.getByText('Basic')).toBeInTheDocument();

      // Check second course details
      expect(screen.getByText('Advanced training for healthcare providers')).toBeInTheDocument();
      expect(screen.getByText('8 hours')).toBeInTheDocument();
      expect(screen.getByText('$199.99')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    const errorMessage = 'Failed to load courses';
    api.get.mockRejectedValue(new Error(errorMessage));
    renderCourses();

    await waitFor(() => {
      expect(screen.getByText(/error loading courses/i)).toBeInTheDocument();
    });
  });

  it('filters courses by level', async () => {
    api.get.mockResolvedValue({ data: mockCourses });
    renderCourses();

    await waitFor(() => {
      expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
      expect(screen.getByText('Advanced Cardiac Life Support (ACLS)')).toBeInTheDocument();
    });

    // Filter by Basic level
    fireEvent.click(screen.getByLabelText('Filter by level'));
    fireEvent.click(screen.getByText('Basic'));

    await waitFor(() => {
      expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
      expect(screen.queryByText('Advanced Cardiac Life Support (ACLS)')).not.toBeInTheDocument();
    });
  });

  it('sorts courses by price', async () => {
    api.get.mockResolvedValue({ data: mockCourses });
    renderCourses();

    await waitFor(() => {
      const courseCards = screen.getAllByTestId('course-card');
      expect(courseCards[0]).toHaveTextContent('Basic Life Support');
      expect(courseCards[1]).toHaveTextContent('Advanced Cardiac Life Support');
    });

    // Sort by price high to low
    fireEvent.click(screen.getByLabelText('Sort by'));
    fireEvent.click(screen.getByText('Price: High to Low'));

    await waitFor(() => {
      const courseCards = screen.getAllByTestId('course-card');
      expect(courseCards[0]).toHaveTextContent('Advanced Cardiac Life Support');
      expect(courseCards[1]).toHaveTextContent('Basic Life Support');
    });
  });

  it('shows course details modal when clicking on a course', async () => {
    api.get.mockResolvedValue({ data: mockCourses });
    renderCourses();

    await waitFor(() => {
      expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Basic Life Support (BLS)'));

    await waitFor(() => {
      expect(screen.getByText('Course Details')).toBeInTheDocument();
      expect(screen.getByText('Learn essential CPR and AED skills')).toBeInTheDocument();
      expect(screen.getByText('Duration: 4 hours')).toBeInTheDocument();
      expect(screen.getByText('Price: $99.99')).toBeInTheDocument();
    });
  });

  it('enrolls in a course when clicking enroll button', async () => {
    api.get.mockResolvedValue({ data: mockCourses });
    api.post.mockResolvedValue({ data: { success: true } });
    renderCourses();

    await waitFor(() => {
      expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Enroll Now'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/enrollments', { courseId: 1 });
      expect(screen.getByText('Successfully enrolled in course')).toBeInTheDocument();
    });
  });

  it('handles enrollment error', async () => {
    api.get.mockResolvedValue({ data: mockCourses });
    api.post.mockRejectedValue(new Error('Enrollment failed'));
    renderCourses();

    await waitFor(() => {
      expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Enroll Now'));

    await waitFor(() => {
      expect(screen.getByText('Failed to enroll in course')).toBeInTheDocument();
    });
  });
}); 