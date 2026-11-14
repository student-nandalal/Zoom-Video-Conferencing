import { fireEvent, render, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import Authentication from './authentication';

jest.mock('axios', () => ({
  __esModule: true,
  default: { create: () => ({}) }
}));

const renderAuthentication = (handleLogin) => render(
  <AuthContext.Provider value={{ handleLogin, handleRegister: jest.fn() }}>
    <Authentication />
  </AuthContext.Provider>
);

test('shows an actionable message when login cannot reach the server', async () => {
  const handleLogin = jest.fn().mockRejectedValue(new Error('Network Error'));
  renderAuthentication(handleLogin);

  fireEvent.click(screen.getByRole('button', { name: /login/i }));

  expect(await screen.findByText(/unable to reach the authentication server/i)).toBeInTheDocument();
});

test('shows the server message when login is rejected', async () => {
  const handleLogin = jest.fn().mockRejectedValue({
    response: { data: { message: 'Invalid Username or password' } }
  });
  renderAuthentication(handleLogin);

  fireEvent.click(screen.getByRole('button', { name: /login/i }));

  expect(await screen.findByText('Invalid Username or password')).toBeInTheDocument();
});
