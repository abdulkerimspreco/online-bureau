import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole, type User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

type Mocked<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? jest.Mock : T[K];
};

function createUser(overrides: Partial<User> = {}): User {
  const now = new Date('2026-05-03T10:00:00.000Z');

  return {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'hashed-password',
    role: UserRole.JOB_SEEKER,
    isVerified: true,
    failedLoginAttempts: 0,
    lockoutUntil: null,
    authTokenVersion: 0,
    passwordResetToken: null,
    passwordResetTokenExpiresAt: null,
    verificationToken: null,
    verificationTokenExpiresAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Mocked<UsersService>;
  let jwtService: Mocked<JwtService>;
  let configService: Mocked<ConfigService>;

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      createJobSeeker: jest.fn(),
      createEmployer: jest.fn(),
      findByVerificationToken: jest.fn(),
      setVerificationToken: jest.fn(),
      setPasswordResetToken: jest.fn(),
      findByPasswordResetToken: jest.fn(),
      clearPasswordResetToken: jest.fn(),
      resetPassword: jest.fn(),
      resetLoginAttempts: jest.fn(),
      recordFailedLoginAttempt: jest.fn(),
      verifyUserEmail: jest.fn(),
    } as unknown as Mocked<UsersService>;

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    } as unknown as Mocked<JwtService>;

    configService = {
      get: jest.fn().mockReturnValue('http://localhost:5173'),
    } as unknown as Mocked<ConfigService>;

    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers a job seeker and returns verification metadata', async () => {
    const user = createUser({ isVerified: false });

    usersService.findByEmail.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
    usersService.createJobSeeker.mockResolvedValue(user);

    const result = await service.registerJobSeeker({
      email: 'new@example.com',
      password: 'Password1!',
      displayName: 'Abdul',
      location: 'Sarajevo',
      preferredJobCategories: 'Backend, Fullstack',
      acceptedTermsAndPrivacy: true,
    });

    expect(usersService.createJobSeeker).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@example.com',
        passwordHash: 'new-hash',
        displayName: 'Abdul',
        location: 'Sarajevo',
        preferredJobCategories: 'Backend, Fullstack',
        verificationToken: expect.any(String),
        verificationTokenExpiresAt: expect.any(Date),
      }),
    );
    expect(result.requiresVerification).toBe(true);
    expect(result.verificationPreviewUrl).toContain('/verify-email?token=');
  });

  it('rejects registration when email is already taken', async () => {
    usersService.findByEmail.mockResolvedValue(createUser());

    await expect(
      service.registerJobSeeker({
        email: 'taken@example.com',
        password: 'Password1!',
        displayName: 'Abdul',
        location: 'Sarajevo',
        preferredJobCategories: 'Backend',
        acceptedTermsAndPrivacy: true,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('logs in a verified user and resets stale failed attempts', async () => {
    const user = createUser({
      failedLoginAttempts: 2,
      lockoutUntil: new Date('2026-05-03T09:59:00.000Z'),
    });
    const resetUser = createUser();

    usersService.findByEmail.mockResolvedValue(user);
    usersService.resetLoginAttempts.mockResolvedValue(resetUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      email: 'user@example.com',
      password: 'Password1!',
    });

    expect(usersService.resetLoginAttempts).toHaveBeenCalledWith(user.id);
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: resetUser.id,
      email: resetUser.email,
      role: resetUser.role,
      tokenVersion: resetUser.authTokenVersion,
    });
    expect(result.accessToken).toBe('signed-token');
  });

  it('locks the account after the fifth failed login attempt', async () => {
    const user = createUser({
      failedLoginAttempts: 4,
    });
    const lockedUser = createUser({
      failedLoginAttempts: 5,
      lockoutUntil: new Date(Date.now() + 15 * 60 * 1000),
    });

    usersService.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    usersService.recordFailedLoginAttempt.mockResolvedValue(lockedUser);

    await expect(
      service.login({
        email: 'user@example.com',
        password: 'wrong',
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(usersService.recordFailedLoginAttempt).toHaveBeenCalledWith(
      user.id,
      5,
      expect.any(Date),
    );
  });

  it('blocks unverified job seekers from logging in', async () => {
    const user = createUser({
      isVerified: false,
      role: UserRole.JOB_SEEKER,
    });

    usersService.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(
      service.login({
        email: user.email,
        password: 'Password1!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('returns a generic password reset response for unknown emails', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    const result = await service.requestPasswordReset({
      email: 'missing@example.com',
    });

    expect(result).toEqual({
      message:
        'If an account with that email exists, a password reset link has been generated.',
    });
    expect(usersService.setPasswordResetToken).not.toHaveBeenCalled();
  });

  it('stores a password reset token and returns a preview url for known users', async () => {
    const user = createUser();
    usersService.findByEmail.mockResolvedValue(user);

    const result = await service.requestPasswordReset({ email: user.email });

    expect(usersService.setPasswordResetToken).toHaveBeenCalledWith(
      user.id,
      expect.any(String),
      expect.any(Date),
    );
    expect(result.resetPreviewUrl).toContain('/reset-password?token=');
  });

  it('clears expired password reset tokens', async () => {
    const user = createUser({
      passwordResetToken: 'reset-token',
      passwordResetTokenExpiresAt: new Date('2026-05-03T09:00:00.000Z'),
    });

    usersService.findByPasswordResetToken.mockResolvedValue(user);

    await expect(
      service.resetPassword({
        token: 'reset-token',
        password: 'NewPassword1!',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(usersService.clearPasswordResetToken).toHaveBeenCalledWith(user.id);
  });

  it('resets the password for a valid token', async () => {
    const user = createUser({
      passwordResetToken: 'reset-token',
      passwordResetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    usersService.findByPasswordResetToken.mockResolvedValue(user);
    (bcrypt.hash as jest.Mock).mockResolvedValue('replacement-hash');

    const result = await service.resetPassword({
      token: 'reset-token',
      password: 'NewPassword1!',
    });

    expect(usersService.resetPassword).toHaveBeenCalledWith(
      user.id,
      'replacement-hash',
    );
    expect(result.message).toContain('Password reset successfully');
  });
});
