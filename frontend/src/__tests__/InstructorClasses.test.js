import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import InstructorClasses from '../components/InstructorClasses';
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
  format: jest.fn((date) => 'May 15, 2025')
}));

describe('InstructorClasses Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders scheduled classes', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        classes: [{
          course_id: 1,
          system_date: '2025-05-07T19:49:59.976Z',
          course_number: '20250501-SEN-FACA',
          date_requested: '2025-05-01T04:00:00.000Z',
          date_scheduled: '2025-05-15T04:00:00.000Z',
          location: 'Room 101',
          status: 'Scheduled',
          course_type_name: 'First Aid',
          organization_name: 'Test Org',
          students_registered: 10,
          students_attendance: 0
        }]
      }
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <InstructorClasses />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Scheduled Classes')).toBeInTheDocument();
      expect(screen.getByText('20250501-SEN-FACA')).toBeInTheDocument();
      expect(screen.getByText('Room 101')).toBeInTheDocument();
      expect(screen.getByText('First Aid')).toBeInTheDocument();
      expect(screen.getByText('Test Org')).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:3001/api/instructor/classes',
      expect.any(Object)
    );
  });

  test('renders completed classes', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        courses: [{
          course_id: 2,
          course_number: '20250401-SEN-FACA',
          date_scheduled: '2025-04-15T04:00:00.000Z',
          location: 'Room 102',
          status: 'Completed',
          course_type_name: 'First Aid',
          organization_name: 'Test Org',
          students_registered: 10,
          students_attendance: 8
        }]
      }
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <InstructorClasses completed={true} />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Completed Classes')).toBeInTheDocument();
      expect(screen.getByText('20250401-SEN-FACA')).toBeInTheDocument();
      expect(screen.getByText('Room 102')).toBeInTheDocument();
      expect(screen.getByText('8/10')).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:3001/api/instructor/completed-classes',
      expect.any(Object)
    );
  });

  test('handles error when fetching classes', async () => {
    axios.get.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <BrowserRouter>
        <AuthProvider>
          <InstructorClasses />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch classes')).toBeInTheDocument();
    });
  });

  test('displays no classes message when empty', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        classes: []
      }
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <InstructorClasses />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No classes scheduled')).toBeInTheDocument();
    });
  });
}); 