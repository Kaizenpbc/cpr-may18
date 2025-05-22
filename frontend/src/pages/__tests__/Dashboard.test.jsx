import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import Dashboard from '../Dashboard';

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  it('renders dashboard title', () => {
    renderDashboard();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    renderDashboard();
    expect(screen.getByText('Total Students')).toBeInTheDocument();
    expect(screen.getByText('Active Courses')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Sessions')).toBeInTheDocument();
    expect(screen.getByText('Active Certifications')).toBeInTheDocument();
  });

  it('renders stat card values', () => {
    renderDashboard();
    expect(screen.getByText('150')).toBeInTheDocument(); // Total Students
    expect(screen.getByText('5')).toBeInTheDocument(); // Active Courses
    expect(screen.getByText('8')).toBeInTheDocument(); // Upcoming Sessions
    expect(screen.getByText('120')).toBeInTheDocument(); // Active Certifications
  });

  it('renders recent activity section', () => {
    renderDashboard();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('No recent activity to display')).toBeInTheDocument();
  });

  it('renders upcoming sessions section', () => {
    renderDashboard();
    expect(screen.getByText('Upcoming Sessions')).toBeInTheDocument();
    expect(screen.getByText('No upcoming sessions to display')).toBeInTheDocument();
  });

  it('renders recent certifications section', () => {
    renderDashboard();
    expect(screen.getByText('Recent Certifications')).toBeInTheDocument();
    expect(screen.getByText('No recent certifications to display')).toBeInTheDocument();
  });

  it('renders with correct layout', () => {
    renderDashboard();
    const container = screen.getByRole('main');
    expect(container).toHaveStyle({
      marginTop: '2rem',
      marginBottom: '2rem',
    });
  });

  it('renders stat cards with icons', () => {
    renderDashboard();
    const statCards = screen.getAllByRole('img', { hidden: true });
    expect(statCards).toHaveLength(4); // One icon per stat card
  });
}); 