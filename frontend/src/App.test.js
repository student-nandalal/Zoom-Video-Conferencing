import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from './pages/landing';

test('renders the landing page', () => {
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { name: /connect with your loved ones/i })).toBeInTheDocument();
});
