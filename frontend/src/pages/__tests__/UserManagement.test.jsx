import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import UserManagement from '../UserManagement';
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

const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'student',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-04-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'instructor',
    status: 'active',
    createdAt: '2024-01-15T00:00:00Z',
    lastLogin: '2024-04-15T00:00:00Z',
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    role: 'admin',
    status: 'inactive',
    createdAt: '2024-02-01T00:00:00Z',
    lastLogin: '2024-03-01T00:00:00Z',
  },
];

const renderUserManagement = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('UserManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders page title', () => {
      renderUserManagement();
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
      api.get.mockImplementation(() => new Promise(() => {}));
      renderUserManagement();
      expect(screen.getByText('Loading users...')).toBeInTheDocument();
    });

    it('loads and displays users', async () => {
      api.get.mockResolvedValue({ data: mockUsers });
      renderUserManagement();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
      });
    });
  });

  describe('User List Display', () => {
    it('displays user details correctly', async () => {
      api.get.mockResolvedValue({ data: mockUsers });
      renderUserManagement();

      await waitFor(() => {
        // Check first user details
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByText('Student')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
        expect(screen.getByText('Apr 1, 2024')).toBeInTheDocument();

        // Check second user details
        expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
        expect(screen.getByText('Instructor')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('shows user status indicators correctly', async () => {
      api.get.mockResolvedValue({ data: mockUsers });
      renderUserManagement();

      await waitFor(() => {
        const activeStatuses = screen.getAllByText('Active');
        const inactiveStatuses = screen.getAllByText('Inactive');
        expect(activeStatuses).toHaveLength(2);
        expect(inactiveStatuses).toHaveLength(1);
      });
    });
  });

  describe('User Filtering', () => {
    it('filters users by role', async () => {
      api.get.mockResolvedValue({ data: mockUsers });
      renderUserManagement();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText('Filter by Role'), { target: { value: 'instructor' } });

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.queryByText('Mike Johnson')).not.toBeInTheDocument();
      });
    });

    it('filters users by status', async () => {
      api.get.mockResolvedValue({ data: mockUsers });
      renderUserManagement();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText('Filter by Status'), { target: { value: 'inactive' } });

      await waitFor(() => {
        expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('filters users by search term', async () => {
      api.get.mockResolvedValue({ data: mockUsers });
      renderUserManagement();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Search users...'), { target: { value: 'smith' } });

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.queryByText('Mike Johnson')).not.toBeInTheDocument();
      });
    });
  });

  describe('User Role Management', () => {
    it('changes user role', async () => {
      api.get.mockResolvedValue({ data: mockUsers });
      api.put.mockResolvedValue({ data: { success: true } });
      renderUserManagement();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('Change Role')[0]);
      fireEvent.click(screen.getByText('Instructor'));

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/users/1/role', { role: 'instructor' });
        expect(screen.getByText('User role updated successfully')).toBeInTheDocument();
      });
    });

    it('handles role change error', async () => {
      api.get.mockResolvedValue({ data: mockUsers });
      api.put.mockRejectedValue(new Error('Failed to update role'));
      renderUserManagement();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('Change Role')[0]);
      fireEvent.click(screen.getByText('Instructor'));

      await waitFor(() => {
        expect(screen.getByText('Failed to update role')).toBeInTheDocument();
      });
    });
  });

  describe('User Status Management', () => {
    it('deactivates user', async () => {
      api.get.mockResolvedValue({ data: mockUsers });
      api.put.mockResolvedValue({ data: { success: true } });
      renderUserManagement();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('Deactivate')[0]);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/users/1/status', { status: 'inactive' });
        expect(screen.getByText('User deactivated successfully')).toBeInTheDocument();
      });
    });

    it('reactivates user', async () => {
      api.get.mockResolvedValue({ data: mockUsers });
      api.put.mockResolvedValue({ data: { success: true } });
      renderUserManagement();

      await waitFor(() => {
        expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Reactivate'));

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/users/3/status', { status: 'active' });
        expect(screen.getByText('User reactivated successfully')).toBeInTheDocument();
      });
    });

    it('handles status change error', async () => {
      api.get.mockResolvedValue({ data: mockUsers });
      api.put.mockRejectedValue(new Error('Failed to update status'));
      renderUserManagement();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('Deactivate')[0]);

      await waitFor(() => {
        expect(screen.getByText('Failed to update status')).toBeInTheDocument();
      });
    });
  });

  describe('User Details', () => {
    it('shows user details modal', async () => {
      api.get.mockResolvedValue({ data: mockUsers });
      renderUserManagement();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('View Details'));

      await waitFor(() => {
        expect(screen.getByText('User Details')).toBeInTheDocument();
        expect(screen.getByText('Email: john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByText('Role: Student')).toBeInTheDocument();
        expect(screen.getByText('Status: Active')).toBeInTheDocument();
        expect(screen.getByText('Created: Jan 1, 2024')).toBeInTheDocument();
        expect(screen.getByText('Last Login: Apr 1, 2024')).toBeInTheDocument();
      });
    });

    it('closes user details modal', async () => {
      api.get.mockResolvedValue({ data: mockUsers });
      renderUserManagement();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('View Details'));
      fireEvent.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(screen.queryByText('User Details')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API error when loading users', async () => {
      api.get.mockRejectedValue(new Error('Failed to load users'));
      renderUserManagement();

      await waitFor(() => {
        expect(screen.getByText(/error loading users/i)).toBeInTheDocument();
      });
    });

    it('shows empty state when no users exist', async () => {
      api.get.mockResolvedValue({ data: [] });
      renderUserManagement();

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
        expect(screen.getByText('Add new users to get started.')).toBeInTheDocument();
      });
    });

    it('shows empty state when no users match filters', async () => {
      api.get.mockResolvedValue({ data: mockUsers });
      renderUserManagement();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Search users...'), { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText('No users match your search criteria')).toBeInTheDocument();
      });
    });
  });
}); 