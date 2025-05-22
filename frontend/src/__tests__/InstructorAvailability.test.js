import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import InstructorAvailability from '../components/InstructorAvailability';
import { AuthProvider } from '../contexts/AuthContext';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock the auth context
jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    isAuthenticated: true,
    token: 'mock-token',
    user: { role: 'Instructor' }
  })
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date) => '2025-05-21')
}));

describe('InstructorAvailability Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders availability calendar', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        availability: ['2025-05-21T04:00:00.000Z']
      }
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <InstructorAvailability />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Availability')).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:3001/api/instructor/availability',
      expect.any(Object)
    );
  });

  test('can add new availability', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        availability: []
      }
    });

    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Availability added successfully'
      }
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <InstructorAvailability />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Availability')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add Availability');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/instructor/availability',
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  test('can delete availability', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        availability: ['2025-05-21T04:00:00.000Z']
      }
    });

    axios.delete.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Availability removed successfully'
      }
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <InstructorAvailability />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Availability')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        'http://localhost:3001/api/instructor/availability/2025-05-21',
        expect.any(Object)
      );
    });
  });

  test('handles error when fetching availability', async () => {
    axios.get.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <BrowserRouter>
        <AuthProvider>
          <InstructorAvailability />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch availability')).toBeInTheDocument();
    });
  });
}); 