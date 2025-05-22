import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import EnrollmentForm from '../EnrollmentForm';
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

const mockSession = {
  id: 1,
  courseId: 1,
  courseName: 'Basic Life Support (BLS)',
  startDate: '2024-05-20T09:00:00',
  endDate: '2024-05-20T13:00:00',
  location: 'Training Center A',
  capacity: 12,
  enrolledCount: 8,
  price: 99.99,
};

const mockUser = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '123-456-7890',
};

const renderEnrollmentForm = (props = {}) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <EnrollmentForm session={mockSession} onSuccess={() => {}} {...props} />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('EnrollmentForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders form title', () => {
      renderEnrollmentForm();
      expect(screen.getByText('Enroll in Course')).toBeInTheDocument();
    });

    it('displays session information', () => {
      renderEnrollmentForm();
      expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
      expect(screen.getByText('May 20, 2024')).toBeInTheDocument();
      expect(screen.getByText('9:00 AM - 1:00 PM')).toBeInTheDocument();
      expect(screen.getByText('Training Center A')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });

    it('shows all required form fields', () => {
      renderEnrollmentForm();
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone')).toBeInTheDocument();
      expect(screen.getByLabelText('Emergency Contact Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Emergency Contact Phone')).toBeInTheDocument();
      expect(screen.getByLabelText('Medical Conditions')).toBeInTheDocument();
      expect(screen.getByLabelText('Special Requirements')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      renderEnrollmentForm();
      fireEvent.click(screen.getByText('Submit Enrollment'));

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Phone is required')).toBeInTheDocument();
        expect(screen.getByText('Emergency contact name is required')).toBeInTheDocument();
        expect(screen.getByText('Emergency contact phone is required')).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      renderEnrollmentForm();
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalid-email' } });
      fireEvent.click(screen.getByText('Submit Enrollment'));

      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });
    });

    it('validates phone number format', async () => {
      renderEnrollmentForm();
      fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '123' } });
      fireEvent.click(screen.getByText('Submit Enrollment'));

      await waitFor(() => {
        expect(screen.getByText('Invalid phone number format')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    const validFormData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '123-456-7890',
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '987-654-3210',
      medicalConditions: 'None',
      specialRequirements: 'None',
    };

    it('submits form with valid data', async () => {
      api.post.mockResolvedValue({ data: { success: true } });
      renderEnrollmentForm();

      // Fill in form fields
      Object.entries(validFormData).forEach(([field, value]) => {
        fireEvent.change(screen.getByLabelText(field.replace(/([A-Z])/g, ' $1').trim()), {
          target: { value },
        });
      });

      fireEvent.click(screen.getByText('Submit Enrollment'));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/enrollments', {
          sessionId: mockSession.id,
          ...validFormData,
        });
        expect(screen.getByText('Enrollment submitted successfully')).toBeInTheDocument();
      });
    });

    it('handles submission error', async () => {
      api.post.mockRejectedValue(new Error('Enrollment failed'));
      renderEnrollmentForm();

      // Fill in form fields
      Object.entries(validFormData).forEach(([field, value]) => {
        fireEvent.change(screen.getByLabelText(field.replace(/([A-Z])/g, ' $1').trim()), {
          target: { value },
        });
      });

      fireEvent.click(screen.getByText('Submit Enrollment'));

      await waitFor(() => {
        expect(screen.getByText('Failed to submit enrollment')).toBeInTheDocument();
      });
    });
  });

  describe('Auto-fill Functionality', () => {
    it('auto-fills form with user data when available', async () => {
      api.get.mockResolvedValue({ data: mockUser });
      renderEnrollmentForm();

      await waitFor(() => {
        expect(screen.getByLabelText('First Name')).toHaveValue('John');
        expect(screen.getByLabelText('Last Name')).toHaveValue('Doe');
        expect(screen.getByLabelText('Email')).toHaveValue('john.doe@example.com');
        expect(screen.getByLabelText('Phone')).toHaveValue('123-456-7890');
      });
    });

    it('allows editing auto-filled data', async () => {
      api.get.mockResolvedValue({ data: mockUser });
      renderEnrollmentForm();

      await waitFor(() => {
        expect(screen.getByLabelText('First Name')).toHaveValue('John');
      });

      fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Johnny' } });

      expect(screen.getByLabelText('First Name')).toHaveValue('Johnny');
    });
  });

  describe('Payment Integration', () => {
    it('shows payment section when payment is required', () => {
      renderEnrollmentForm();
      expect(screen.getByText('Payment Information')).toBeInTheDocument();
      expect(screen.getByText('Total Amount: $99.99')).toBeInTheDocument();
    });

    it('validates payment information', async () => {
      renderEnrollmentForm();
      fireEvent.click(screen.getByText('Submit Enrollment'));

      await waitFor(() => {
        expect(screen.getByText('Payment information is required')).toBeInTheDocument();
      });
    });

    it('processes payment successfully', async () => {
      api.post.mockResolvedValue({ data: { success: true } });
      renderEnrollmentForm();

      // Fill in payment information
      fireEvent.change(screen.getByLabelText('Card Number'), { target: { value: '4111111111111111' } });
      fireEvent.change(screen.getByLabelText('Expiry Date'), { target: { value: '12/25' } });
      fireEvent.change(screen.getByLabelText('CVV'), { target: { value: '123' } });

      // Fill in other required fields
      Object.entries(validFormData).forEach(([field, value]) => {
        fireEvent.change(screen.getByLabelText(field.replace(/([A-Z])/g, ' $1').trim()), {
          target: { value },
        });
      });

      fireEvent.click(screen.getByText('Submit Enrollment'));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/payments', expect.any(Object));
        expect(screen.getByText('Payment processed successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API error gracefully', async () => {
      api.get.mockRejectedValue(new Error('Failed to load user data'));
      renderEnrollmentForm();

      await waitFor(() => {
        expect(screen.getByText(/error loading user data/i)).toBeInTheDocument();
      });
    });

    it('shows error message when session is full', () => {
      const fullSession = {
        ...mockSession,
        enrolledCount: mockSession.capacity,
      };
      renderEnrollmentForm({ session: fullSession });

      expect(screen.getByText('This session is full')).toBeInTheDocument();
      expect(screen.queryByText('Submit Enrollment')).not.toBeInTheDocument();
    });
  });
}); 