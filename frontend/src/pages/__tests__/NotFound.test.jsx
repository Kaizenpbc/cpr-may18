import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFound from '../NotFound';

const renderNotFound = () => {
  return render(
    <BrowserRouter>
      <NotFound />
    </BrowserRouter>
  );
};

describe('NotFound Component', () => {
  it('renders 404 message', () => {
    renderNotFound();
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  it('renders error description', () => {
    renderNotFound();
    expect(screen.getByText(/the page you are looking for might have been removed/i)).toBeInTheDocument();
  });

  it('renders back to home button', () => {
    renderNotFound();
    const homeButton = screen.getByRole('button', { name: /back to home/i });
    expect(homeButton).toBeInTheDocument();
  });

  it('navigates to home when clicking back button', () => {
    renderNotFound();
    const homeButton = screen.getByRole('button', { name: /back to home/i });
    fireEvent.click(homeButton);
    expect(window.location.pathname).toBe('/');
  });

  it('renders with correct styling', () => {
    renderNotFound();
    const container = screen.getByRole('main');
    expect(container).toHaveStyle({
      marginTop: '8rem',
    });
  });
}); 