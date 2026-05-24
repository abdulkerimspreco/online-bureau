import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/auth/AuthContext';

vi.mock('../context/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe('ProtectedRoute', () => {
  it('shows a loading state while auth is bootstrapping', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      registerJobSeeker: vi.fn(),
      registerEmployer: vi.fn(),
      logout: vi.fn(),
      refreshMe: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/job-seeker/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['JOB_SEEKER']} />}>
            <Route path="/job-seeker/dashboard" element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to login', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      registerJobSeeker: vi.fn(),
      registerEmployer: vi.fn(),
      logout: vi.fn(),
      refreshMe: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route element={<ProtectedRoute allowedRoles={['JOB_SEEKER']} />}>
            <Route path="/protected" element={<div>Protected content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('renders nested content when the role is allowed', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'jobseeker@example.com',
        role: 'JOB_SEEKER',
        isVerified: true,
        isActive: true,
        createdAt: '2026-05-03T10:00:00.000Z',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      registerJobSeeker: vi.fn(),
      registerEmployer: vi.fn(),
      logout: vi.fn(),
      refreshMe: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['JOB_SEEKER']} />}>
            <Route path="/protected" element={<div>Protected content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});
