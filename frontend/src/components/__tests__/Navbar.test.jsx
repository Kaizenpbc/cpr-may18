import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import Navbar from '../Navbar';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderNavbar = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Navbar Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders login button when not authenticated', () => {
    renderNavbar();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('renders navigation links when authenticated', () => {
    // Mock authenticated state
    vi.spyOn(React, 'useContext').mockImplementation(() => ({
      isAuthenticated: true,
      logout: vi.fn(),
    }));

    renderNavbar();
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/courses/i)).toBeInTheDocument();
    expect(screen.getByText(/sessions/i)).toBeInTheDocument();
    expect(screen.getByText(/certifications/i)).toBeInTheDocument();
  });

  it('opens profile menu when clicking account icon', () => {
    // Mock authenticated state
    vi.spyOn(React, 'useContext').mockImplementation(() => ({
      isAuthenticated: true,
      logout: vi.fn(),
    }));

    renderNavbar();
    const accountButton = screen.getByLabelText(/account of current user/i);
    fireEvent.click(accountButton);

    expect(screen.getByText(/profile/i)).toBeInTheDocument();
    expect(screen.getByText(/logout/i)).toBeInTheDocument();
  });

  it('opens mobile menu when clicking menu icon', () => {
    // Mock authenticated state
    vi.spyOn(React, 'useContext').mockImplementation(() => ({
      isAuthenticated: true,
      logout: vi.fn(),
    }));

    renderNavbar();
    const menuButton = screen.getByLabelText(/show menu/i);
    fireEvent.click(menuButton);

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/courses/i)).toBeInTheDocument();
    expect(screen.getByText(/sessions/i)).toBeInTheDocument();
    expect(screen.getByText(/certifications/i)).toBeInTheDocument();
  });

  it('handles logout', () => {
    const mockLogout = vi.fn();
    // Mock authenticated state
    vi.spyOn(React, 'useContext').mockImplementation(() => ({
      isAuthenticated: true,
      logout: mockLogout,
    }));

    renderNavbar();
    const accountButton = screen.getByLabelText(/account of current user/i);
    fireEvent.click(accountButton);

    const logoutButton = screen.getByText(/logout/i);
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('navigates to home when clicking logo', () => {
    renderNavbar();
    const logo = screen.getByText(/cpr training system/i);
    fireEvent.click(logo);
    expect(window.location.pathname).toBe('/');
  });
}); 