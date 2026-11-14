import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import History from './history';

jest.mock('axios', () => ({
  __esModule: true,
  default: { create: () => ({}) }
}));

const renderHistory = (getHistoryOfUser) => render(
  <MemoryRouter>
    <AuthContext.Provider value={{ getHistoryOfUser }}>
      <History />
    </AuthContext.Provider>
  </MemoryRouter>
);

test('shows saved meetings in history', async () => {
  renderHistory(jest.fn().mockResolvedValue([
    { _id: 'meeting-1', meetingCode: 'weekly-sync', date: '2025-01-02T00:00:00.000Z' }
  ]));

  expect(await screen.findByText('Code: weekly-sync')).toBeInTheDocument();
  expect(screen.getByText(/^Date:/)).toBeInTheDocument();
});

test('shows an empty state when the user has no meeting history', async () => {
  renderHistory(jest.fn().mockResolvedValue([]));

  expect(await screen.findByText(/no meetings yet/i)).toBeInTheDocument();
});
