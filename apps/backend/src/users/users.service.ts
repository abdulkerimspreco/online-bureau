import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async createJobSeeker(params: {
    email: string;
    passwordHash: string;
    displayName: string;
    location: string;
    preferredJobCategories?: string;
    verificationToken: string;
    verificationTokenExpiresAt: Date;
  }): Promise<User> {
    const {
      email,
      passwordHash,
      displayName,
      location,
      preferredJobCategories,
      verificationToken,
      verificationTokenExpiresAt,
    } = params;

    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.JOB_SEEKER,
        verificationToken,
        verificationTokenExpiresAt,
        jobSeekerProfile: {
          create: {
            displayName,
            location,
            preferredJobCategories,
          },
        },
      },
    });
  }

  async createEmployer(params: {
    email: string;
    passwordHash: string;
    companyName: string;
    description?: string;
    website?: string;
    industry: string;
    companySize?: string;
    verificationToken: string;
    verificationTokenExpiresAt: Date;
  }): Promise<User> {
    const {
      email,
      passwordHash,
      companyName,
      description,
      website,
      industry,
      companySize,
      verificationToken,
      verificationTokenExpiresAt,
    } = params;

    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.EMPLOYER,
        verificationToken,
        verificationTokenExpiresAt,
        employerProfile: {
          create: {
            companyName,
            description,
            website,
            industry,
            companySize,
          },
        },
      },
    });
  }

  findByVerificationToken(token: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { verificationToken: token },
    });
  }

  setVerificationToken(
    userId: string,
    verificationToken: string,
    verificationTokenExpiresAt: Date,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        verificationToken,
        verificationTokenExpiresAt,
      },
    });
  }

  setPasswordResetToken(
    userId: string,
    passwordResetToken: string,
    passwordResetTokenExpiresAt: Date,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken,
        passwordResetTokenExpiresAt,
      },
    });
  }

  findByPasswordResetToken(token: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { passwordResetToken: token },
    });
  }

  clearPasswordResetToken(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
      },
    });
  }

  resetPassword(userId: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        authTokenVersion: {
          increment: 1,
        },
      },
    });
  }

  resetLoginAttempts(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });
  }

  recordFailedLoginAttempt(
    userId: string,
    failedLoginAttempts: number,
    lockoutUntil: Date | null,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts,
        lockoutUntil,
      },
    });
  }

  verifyUserEmail(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiresAt: null,
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });
  }

  findAccountForDeletion(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        cv: true,
        jobSeekerProfile: true,
        employerProfile: true,
      },
    });
  }

  deleteUserAccount(userId: string) {
    return this.prisma.user.delete({
      where: { id: userId },
    });
  }

  createAccountDeletionAudit(params: {
    receiptCode: string;
    deletedEmail: string;
    deletedRole: UserRole;
    hadCv: boolean;
    requestedAt: Date;
  }) {
    return this.prisma.accountDeletionAudit.create({
      data: params,
    });
  }
}
