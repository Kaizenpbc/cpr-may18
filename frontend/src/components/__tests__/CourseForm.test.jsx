import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import CourseForm from '../CourseForm';
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

const mockInstructors = [
  { id: 1, name: 'Jane Smith', specialization: 'BLS' },
  { id: 2, name: 'Mike Johnson', specialization: 'ACLS' },
];

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
  instructorId: 1,
};

const renderCourseForm = (props = {}) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <CourseForm {...props} />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('CourseForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders form title for new course', () => {
      renderCourseForm();
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });

    it('renders form title for editing course', () => {
      renderCourseForm({ course: mockCourse });
      expect(screen.getByText('Edit Course')).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
      api.get.mockImplementation(() => new Promise(() => {}));
      renderCourseForm();
      expect(screen.getByText('Loading instructors...')).toBeInTheDocument();
    });

    it('loads instructor list', async () => {
      api.get.mockResolvedValue({ data: mockInstructors });
      renderCourseForm();

      await waitFor(() => {
        expect(screen.getByLabelText('Instructor')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
      });
    });
  });

  describe('Form Fields', () => {
    it('displays all required form fields', async () => {
      api.get.mockResolvedValue({ data: mockInstructors });
      renderCourseForm();

      await waitFor(() => {
        expect(screen.getByLabelText('Course Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Description')).toBeInTheDocument();
        expect(screen.getByLabelText('Duration')).toBeInTheDocument();
        expect(screen.getByLabelText('Price')).toBeInTheDocument();
        expect(screen.getByLabelText('Level')).toBeInTheDocument();
        expect(screen.getByLabelText('Prerequisites')).toBeInTheDocument();
        expect(screen.getByLabelText('Learning Objectives')).toBeInTheDocument();
        expect(screen.getByLabelText('Course Materials')).toBeInTheDocument();
        expect(screen.getByLabelText('Instructor')).toBeInTheDocument();
      });
    });

    it('pre-fills form fields when editing', async () => {
      api.get.mockResolvedValue({ data: mockInstructors });
      renderCourseForm({ course: mockCourse });

      await waitFor(() => {
        expect(screen.getByLabelText('Course Name')).toHaveValue('Basic Life Support (BLS)');
        expect(screen.getByLabelText('Description')).toHaveValue('Learn essential CPR and AED skills for healthcare providers and first responders.');
        expect(screen.getByLabelText('Duration')).toHaveValue('4 hours');
        expect(screen.getByLabelText('Price')).toHaveValue('99.99');
        expect(screen.getByLabelText('Level')).toHaveValue('Basic');
      });
    });
  });

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      api.get.mockResolvedValue({ data: mockInstructors });
      renderCourseForm();

      await waitFor(() => {
        expect(screen.getByText('Create Course')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create Course'));

      await waitFor(() => {
        expect(screen.getByText('Course name is required')).toBeInTheDocument();
        expect(screen.getByText('Description is required')).toBeInTheDocument();
        expect(screen.getByText('Duration is required')).toBeInTheDocument();
        expect(screen.getByText('Price is required')).toBeInTheDocument();
        expect(screen.getByText('Level is required')).toBeInTheDocument();
        expect(screen.getByText('Instructor is required')).toBeInTheDocument();
      });
    });

    it('validates price format', async () => {
      api.get.mockResolvedValue({ data: mockInstructors });
      renderCourseForm();

      await waitFor(() => {
        expect(screen.getByLabelText('Price')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText('Price'), { target: { value: 'invalid' } });
      fireEvent.click(screen.getByText('Create Course'));

      await waitFor(() => {
        expect(screen.getByText('Price must be a valid number')).toBeInTheDocument();
      });
    });

    it('validates duration format', async () => {
      api.get.mockResolvedValue({ data: mockInstructors });
      renderCourseForm();

      await waitFor(() => {
        expect(screen.getByLabelText('Duration')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText('Duration'), { target: { value: 'invalid' } });
      fireEvent.click(screen.getByText('Create Course'));

      await waitFor(() => {
        expect(screen.getByText('Duration must be in hours (e.g., 4 hours)')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    const validFormData = {
      name: 'New Course',
      description: 'Course description',
      duration: '4 hours',
      price: '99.99',
      level: 'Basic',
      prerequisites: ['None'],
      objectives: ['Objective 1', 'Objective 2'],
      materials: ['Material 1', 'Material 2'],
      instructorId: '1',
    };

    it('submits form with valid data for new course', async () => {
      api.get.mockResolvedValue({ data: mockInstructors });
      api.post.mockResolvedValue({ data: { success: true } });
      renderCourseForm();

      await waitFor(() => {
        expect(screen.getByLabelText('Course Name')).toBeInTheDocument();
      });

      // Fill in form fields
      Object.entries(validFormData).forEach(([field, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            fireEvent.change(screen.getByLabelText(field.replace(/([A-Z])/g, ' $1').trim()), {
              target: { value: item },
            });
            if (index < value.length - 1) {
              fireEvent.click(screen.getByText('Add'));
            }
          });
        } else {
          fireEvent.change(screen.getByLabelText(field.replace(/([A-Z])/g, ' $1').trim()), {
            target: { value },
          });
        }
      });

      fireEvent.click(screen.getByText('Create Course'));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/courses', expect.any(Object));
        expect(screen.getByText('Course created successfully')).toBeInTheDocument();
      });
    });

    it('submits form with valid data for editing course', async () => {
      api.get.mockResolvedValue({ data: mockInstructors });
      api.put.mockResolvedValue({ data: { success: true } });
      renderCourseForm({ course: mockCourse });

      await waitFor(() => {
        expect(screen.getByLabelText('Course Name')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText('Course Name'), { target: { value: 'Updated Course' } });
      fireEvent.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/courses/1', expect.any(Object));
        expect(screen.getByText('Course updated successfully')).toBeInTheDocument();
      });
    });

    it('handles submission error', async () => {
      api.get.mockResolvedValue({ data: mockInstructors });
      api.post.mockRejectedValue(new Error('Failed to create course'));
      renderCourseForm();

      await waitFor(() => {
        expect(screen.getByLabelText('Course Name')).toBeInTheDocument();
      });

      // Fill in form fields
      Object.entries(validFormData).forEach(([field, value]) => {
        if (!Array.isArray(value)) {
          fireEvent.change(screen.getByLabelText(field.replace(/([A-Z])/g, ' $1').trim()), {
            target: { value },
          });
        }
      });

      fireEvent.click(screen.getByText('Create Course'));

      await waitFor(() => {
        expect(screen.getByText('Failed to create course')).toBeInTheDocument();
      });
    });
  });

  describe('File Upload', () => {
    it('allows uploading course materials', async () => {
      api.get.mockResolvedValue({ data: mockInstructors });
      renderCourseForm();

      await waitFor(() => {
        expect(screen.getByLabelText('Course Materials')).toBeInTheDocument();
      });

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText('Upload Materials');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
    });

    it('validates file type', async () => {
      api.get.mockResolvedValue({ data: mockInstructors });
      renderCourseForm();

      await waitFor(() => {
        expect(screen.getByLabelText('Course Materials')).toBeInTheDocument();
      });

      const file = new File(['test content'], 'test.exe', { type: 'application/x-msdownload' });
      const input = screen.getByLabelText('Upload Materials');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('Invalid file type. Please upload PDF, DOC, or DOCX files.')).toBeInTheDocument();
      });
    });

    it('validates file size', async () => {
      api.get.mockResolvedValue({ data: mockInstructors });
      renderCourseForm();

      await waitFor(() => {
        expect(screen.getByLabelText('Course Materials')).toBeInTheDocument();
      });

      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText('Upload Materials');

      fireEvent.change(input, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByText('File size must be less than 10MB')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API error when loading instructors', async () => {
      api.get.mockRejectedValue(new Error('Failed to load instructors'));
      renderCourseForm();

      await waitFor(() => {
        expect(screen.getByText(/error loading instructors/i)).toBeInTheDocument();
      });
    });

    it('handles file upload error', async () => {
      api.get.mockResolvedValue({ data: mockInstructors });
      api.post.mockRejectedValue(new Error('Failed to upload file'));
      renderCourseForm();

      await waitFor(() => {
        expect(screen.getByLabelText('Course Materials')).toBeInTheDocument();
      });

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText('Upload Materials');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('Failed to upload file')).toBeInTheDocument();
      });
    });
  });
}); 