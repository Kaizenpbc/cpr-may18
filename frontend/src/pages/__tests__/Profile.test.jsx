import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import Profile from '../Profile';
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

const mockUser = {
  id: 1,
  username: 'johndoe',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'student',
  phone: '123-456-7890',
  address: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  zipCode: '12345',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockEnrollments = [
  {
    id: 1,
    courseId: 1,
    courseName: 'Basic Life Support (BLS)',
    sessionId: 1,
    sessionDate: '2024-05-20T09:00:00',
    status: 'enrolled',
  },
  {
    id: 2,
    courseId: 2,
    courseName: 'Advanced Cardiac Life Support (ACLS)',
    sessionId: 2,
    sessionDate: '2024-05-25T09:00:00',
    status: 'completed',
  },
];

const renderProfile = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Profile />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Profile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders profile title', () => {
      renderProfile();
      expect(screen.getByText('My Profile')).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
      api.get.mockImplementation(() => new Promise(() => {}));
      renderProfile();
      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });

    it('displays user information when data is loaded', async () => {
      api.get.mockResolvedValue({ data: mockUser });
      renderProfile();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByText('123-456-7890')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Information', () => {
    it('displays all user details correctly', async () => {
      api.get.mockResolvedValue({ data: mockUser });
      renderProfile();

      await waitFor(() => {
        expect(screen.getByText('Username: johndoe')).toBeInTheDocument();
        expect(screen.getByText('Email: john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByText('Phone: 123-456-7890')).toBeInTheDocument();
        expect(screen.getByText('Address: 123 Main St')).toBeInTheDocument();
        expect(screen.getByText('City: Anytown')).toBeInTheDocument();
        expect(screen.getByText('State: CA')).toBeInTheDocument();
        expect(screen.getByText('ZIP Code: 12345')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Editing', () => {
    it('enables edit mode when clicking edit button', async () => {
      api.get.mockResolvedValue({ data: mockUser });
      renderProfile();

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Profile'));

      expect(screen.getByLabelText('First Name')).toBeEnabled();
      expect(screen.getByLabelText('Last Name')).toBeEnabled();
      expect(screen.getByLabelText('Phone')).toBeEnabled();
      expect(screen.getByLabelText('Address')).toBeEnabled();
      expect(screen.getByLabelText('City')).toBeEnabled();
      expect(screen.getByLabelText('State')).toBeEnabled();
      expect(screen.getByLabelText('ZIP Code')).toBeEnabled();
    });

    it('saves profile changes successfully', async () => {
      api.get.mockResolvedValue({ data: mockUser });
      api.put.mockResolvedValue({ data: { ...mockUser, firstName: 'Johnny' } });
      renderProfile();

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Profile'));
      fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Johnny' } });
      fireEvent.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/users/1', expect.any(Object));
        expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
      });
    });

    it('handles save error', async () => {
      api.get.mockResolvedValue({ data: mockUser });
      api.put.mockRejectedValue(new Error('Update failed'));
      renderProfile();

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Profile'));
      fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Johnny' } });
      fireEvent.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(screen.getByText('Failed to update profile')).toBeInTheDocument();
      });
    });
  });

  describe('Enrollment History', () => {
    it('displays enrollment history', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockUser })
        .mockResolvedValueOnce({ data: mockEnrollments });
      renderProfile();

      await waitFor(() => {
        expect(screen.getByText('Enrollment History')).toBeInTheDocument();
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
        expect(screen.getByText('Advanced Cardiac Life Support (ACLS)')).toBeInTheDocument();
      });
    });

    it('shows enrollment status correctly', async () => {
      api.get
        .mockResolvedValueOnce({ data: mockUser })
        .mockResolvedValueOnce({ data: mockEnrollments });
      renderProfile();

      await waitFor(() => {
        expect(screen.getByText('Status: Enrolled')).toBeInTheDocument();
        expect(screen.getByText('Status: Completed')).toBeInTheDocument();
      });
    });
  });

  describe('Password Management', () => {
    it('shows change password form when clicking change password button', async () => {
      api.get.mockResolvedValue({ data: mockUser });
      renderProfile();

      await waitFor(() => {
        expect(screen.getByText('Change Password')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Change Password'));

      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
      expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    });

    it('changes password successfully', async () => {
      api.get.mockResolvedValue({ data: mockUser });
      api.put.mockResolvedValue({ data: { success: true } });
      renderProfile();

      await waitFor(() => {
        expect(screen.getByText('Change Password')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Change Password'));
      fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'oldpass' } });
      fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass' } });
      fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'newpass' } });
      fireEvent.click(screen.getByText('Update Password'));

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/users/1/password', expect.any(Object));
        expect(screen.getByText('Password updated successfully')).toBeInTheDocument();
      });
    });

    it('validates password match', async () => {
      api.get.mockResolvedValue({ data: mockUser });
      renderProfile();

      await waitFor(() => {
        expect(screen.getByText('Change Password')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Change Password'));
      fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'oldpass' } });
      fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass' } });
      fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'different' } });
      fireEvent.click(screen.getByText('Update Password'));

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API error gracefully', async () => {
      const errorMessage = 'Failed to load profile';
      api.get.mockRejectedValue(new Error(errorMessage));
      renderProfile();

      await waitFor(() => {
        expect(screen.getByText(/error loading profile/i)).toBeInTheDocument();
      });
    });
  });
}); 