import { render, screen } from '@testing-library/react';
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
    const heading = screen.getByRole('heading', { name: /404/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders error description', () => {
    renderNotFound();
    const description = screen.getByText(/The page you are looking for might have been removed/i);
    expect(description).toBeInTheDocument();
  });

  it('renders back to home link', () => {
    renderNotFound();
    const homeLink = screen.getByRole('link', { name: /back to home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('navigates to home when clicking back link', () => {
    renderNotFound();
    const homeLink = screen.getByRole('link', { name: /back to home/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders with correct styling', () => {
    renderNotFound();
    const container = screen.getByRole('heading', { name: /404/i }).closest('div');
    expect(container).toHaveClass('MuiContainer-root');
  });
}); 