import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import EmployerVerificationNotice from './EmployerVerificationNotice';
import { requestVerificationLink } from '../../api/auth/auth.api';
import { useAuth } from '../../context/auth/AuthContext';

vi.mock('../../api/auth/auth.api', () => ({
  requestVerificationLink: vi.fn(),
}));

vi.mock('../../context/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockedRequestVerificationLink = vi.mocked(requestVerificationLink);
const mockedUseAuth = vi.mocked(useAuth);

describe('EmployerVerificationNotice', () => {
  const refreshMe = vi.fn();

  beforeEach(() => {
    refreshMe.mockReset();
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'emp-1',
        email: 'employer@example.com',
        role: 'EMPLOYER',
        isVerified: false,
        createdAt: '2026-05-03T10:00:00.000Z',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      registerJobSeeker: vi.fn(),
      registerEmployer: vi.fn(),
      logout: vi.fn(),
      refreshMe,
    });
  });

  it('navigates to the returned verification preview url', async () => {
    const user = userEvent.setup();
    mockedRequestVerificationLink.mockResolvedValue({
      message: 'Verification link generated successfully.',
      verificationPreviewUrl: 'http://localhost:5173/verify-email?token=abc',
    });

    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: 'http://localhost:5173/current' },
    });

    render(<EmployerVerificationNotice />);
    await user.click(screen.getByRole('button', { name: 'Verify now' }));

    expect(mockedRequestVerificationLink).toHaveBeenCalled();
    expect(window.location.href).toBe(
      'http://localhost:5173/verify-email?token=abc',
    );

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('refreshes auth state when the backend says the email is already verified', async () => {
    const user = userEvent.setup();
    mockedRequestVerificationLink.mockRejectedValue({
      response: {
        data: {
          message: 'Email already verified',
        },
      },
    });

    render(<EmployerVerificationNotice />);
    await user.click(screen.getByRole('button', { name: 'Verify now' }));

    await waitFor(() => {
      expect(refreshMe).toHaveBeenCalled();
    });
  });
});
