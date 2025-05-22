import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import Certifications from '../Certifications';
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

const mockCertifications = [
  {
    id: 1,
    userId: 1,
    courseId: 1,
    courseName: 'Basic Life Support (BLS)',
    issueDate: '2024-01-15',
    expirationDate: '2025-01-15',
    certificationNumber: 'BLS-2024-001',
    status: 'active',
    instructorName: 'John Doe',
  },
  {
    id: 2,
    userId: 1,
    courseId: 2,
    courseName: 'Advanced Cardiac Life Support (ACLS)',
    issueDate: '2024-02-01',
    expirationDate: '2025-02-01',
    certificationNumber: 'ACLS-2024-001',
    status: 'active',
    instructorName: 'Jane Smith',
  },
];

const renderCertifications = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Certifications />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Certifications Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders certifications list title', () => {
      renderCertifications();
      expect(screen.getByText('My Certifications')).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
      api.get.mockImplementation(() => new Promise(() => {}));
      renderCertifications();
      expect(screen.getByText('Loading certifications...')).toBeInTheDocument();
    });

    it('displays certifications when data is loaded', async () => {
      api.get.mockResolvedValue({ data: mockCertifications });
      renderCertifications();

      await waitFor(() => {
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
        expect(screen.getByText('Advanced Cardiac Life Support (ACLS)')).toBeInTheDocument();
      });
    });
  });

  describe('Certification Details', () => {
    it('displays certification information correctly', async () => {
      api.get.mockResolvedValue({ data: mockCertifications });
      renderCertifications();

      await waitFor(() => {
        // Check first certification details
        expect(screen.getByText('BLS-2024-001')).toBeInTheDocument();
        expect(screen.getByText('Issued: Jan 15, 2024')).toBeInTheDocument();
        expect(screen.getByText('Expires: Jan 15, 2025')).toBeInTheDocument();
        expect(screen.getByText('Instructor: John Doe')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();

        // Check second certification details
        expect(screen.getByText('ACLS-2024-001')).toBeInTheDocument();
        expect(screen.getByText('Issued: Feb 1, 2024')).toBeInTheDocument();
        expect(screen.getByText('Expires: Feb 1, 2025')).toBeInTheDocument();
        expect(screen.getByText('Instructor: Jane Smith')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering and Sorting', () => {
    it('filters certifications by course', async () => {
      api.get.mockResolvedValue({ data: mockCertifications });
      renderCertifications();

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

    it('filters certifications by status', async () => {
      const expiredCert = {
        ...mockCertifications[0],
        status: 'expired',
      };
      api.get.mockResolvedValue({ data: [expiredCert, mockCertifications[1]] });
      renderCertifications();

      await waitFor(() => {
        expect(screen.getByText('Expired')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Filter by status'));
      fireEvent.click(screen.getByText('Active'));

      await waitFor(() => {
        expect(screen.queryByText('Expired')).not.toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('sorts certifications by expiration date', async () => {
      api.get.mockResolvedValue({ data: mockCertifications });
      renderCertifications();

      await waitFor(() => {
        const certCards = screen.getAllByTestId('certification-card');
        expect(certCards[0]).toHaveTextContent('Jan 15, 2025');
        expect(certCards[1]).toHaveTextContent('Feb 1, 2025');
      });

      fireEvent.click(screen.getByLabelText('Sort by'));
      fireEvent.click(screen.getByText('Expiration: Latest First'));

      await waitFor(() => {
        const certCards = screen.getAllByTestId('certification-card');
        expect(certCards[0]).toHaveTextContent('Feb 1, 2025');
        expect(certCards[1]).toHaveTextContent('Jan 15, 2025');
      });
    });
  });

  describe('Certification Management', () => {
    it('shows certification details modal when clicking on a certification', async () => {
      api.get.mockResolvedValue({ data: mockCertifications });
      renderCertifications();

      await waitFor(() => {
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Basic Life Support (BLS)'));

      await waitFor(() => {
        expect(screen.getByText('Certification Details')).toBeInTheDocument();
        expect(screen.getByText('Certification Number: BLS-2024-001')).toBeInTheDocument();
        expect(screen.getByText('Issued: Jan 15, 2024')).toBeInTheDocument();
        expect(screen.getByText('Expires: Jan 15, 2025')).toBeInTheDocument();
        expect(screen.getByText('Instructor: John Doe')).toBeInTheDocument();
      });
    });

    it('allows downloading certification PDF', async () => {
      api.get.mockResolvedValue({ data: mockCertifications });
      api.get.mockResolvedValueOnce({ data: new Blob(['pdf content'], { type: 'application/pdf' }) });
      renderCertifications();

      await waitFor(() => {
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Download PDF'));

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/certifications/1/pdf');
      });
    });

    it('handles download error', async () => {
      api.get.mockResolvedValue({ data: mockCertifications });
      api.get.mockRejectedValueOnce(new Error('Download failed'));
      renderCertifications();

      await waitFor(() => {
        expect(screen.getByText('Basic Life Support (BLS)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Download PDF'));

      await waitFor(() => {
        expect(screen.getByText('Failed to download certification')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API error gracefully', async () => {
      const errorMessage = 'Failed to load certifications';
      api.get.mockRejectedValue(new Error(errorMessage));
      renderCertifications();

      await waitFor(() => {
        expect(screen.getByText(/error loading certifications/i)).toBeInTheDocument();
      });
    });

    it('shows empty state when no certifications exist', async () => {
      api.get.mockResolvedValue({ data: [] });
      renderCertifications();

      await waitFor(() => {
        expect(screen.getByText('No certifications found')).toBeInTheDocument();
        expect(screen.getByText('You haven\'t earned any certifications yet.')).toBeInTheDocument();
      });
    });
  });

  describe('Renewal Process', () => {
    it('shows renewal button for expiring certifications', async () => {
      const expiringCert = {
        ...mockCertifications[0],
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };
      api.get.mockResolvedValue({ data: [expiringCert] });
      renderCertifications();

      await waitFor(() => {
        expect(screen.getByText('Renew Certification')).toBeInTheDocument();
      });
    });

    it('initiates renewal process when clicking renew button', async () => {
      const expiringCert = {
        ...mockCertifications[0],
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };
      api.get.mockResolvedValue({ data: [expiringCert] });
      api.post.mockResolvedValue({ data: { success: true } });
      renderCertifications();

      await waitFor(() => {
        expect(screen.getByText('Renew Certification')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Renew Certification'));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/certifications/1/renew');
        expect(screen.getByText('Renewal request submitted successfully')).toBeInTheDocument();
      });
    });

    it('handles renewal error', async () => {
      const expiringCert = {
        ...mockCertifications[0],
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };
      api.get.mockResolvedValue({ data: [expiringCert] });
      api.post.mockRejectedValue(new Error('Renewal failed'));
      renderCertifications();

      await waitFor(() => {
        expect(screen.getByText('Renew Certification')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Renew Certification'));

      await waitFor(() => {
        expect(screen.getByText('Failed to submit renewal request')).toBeInTheDocument();
      });
    });
  });
}); 