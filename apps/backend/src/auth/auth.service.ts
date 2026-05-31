import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { UsersService } from '../users/users.service';
import { RegisterJobSeekerDto } from './dto/register-job-seeker.dto';
import { RegisterEmployerDto } from './dto/register-employer.dto';
import { LoginDto } from './dto/login.dto';
import { toAuthResponseUser } from './auth.mapper';
import {
    ForgotPasswordResponse,
    ResetPasswordResponse,
    VerificationLinkResponse,
    VerificationRegistrationResponse,
    DeleteAccountResponse,
} from './auth.types';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';

@Injectable()
export class AuthService {
    private static readonly MAX_FAILED_LOGIN_ATTEMPTS = 5;
    private static readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000;

    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    private async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    private async comparePasswords(
        plainPassword: string,
        passwordHash: string,
    ): Promise<boolean> {
        return bcrypt.compare(plainPassword, passwordHash);
    }

    private signToken(user: User): string {
        return this.jwtService.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
            tokenVersion: user.authTokenVersion,
        });
    }

    private createVerificationToken(): string {
        return randomBytes(32).toString('hex');
    }

    private createDeletionReceiptCode(): string {
        return `DEL-${randomBytes(4).toString('hex').toUpperCase()}`;
    }

    private buildVerificationPreviewUrl(token: string): string {
        const frontendUrl =
            this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';

        return `${frontendUrl}/verify-email?token=${token}`;
    }

    private buildPasswordResetPreviewUrl(token: string): string {
        const frontendUrl =
            this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';

        return `${frontendUrl}/reset-password?token=${token}`;
    }

    private buildLockoutMessage(lockoutUntil: Date): string {
        const remainingMinutes = Math.max(
            1,
            Math.ceil((lockoutUntil.getTime() - Date.now()) / (60 * 1000)),
        );

        return `Too many failed login attempts. Try again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`;
    }

    private resolveStoredCvPath(fileUrl: string | null | undefined) {
        if (!fileUrl) return null;

        if (fileUrl.startsWith('/uploads/')) {
            return join(process.cwd(), fileUrl.slice(1));
        }

        if (fileUrl.startsWith('/')) {
            return fileUrl;
        }

        return join(process.cwd(), fileUrl);
    }

    async registerJobSeeker(
        dto: RegisterJobSeekerDto,
    ): Promise<VerificationRegistrationResponse> {
        const existingUser = await this.usersService.findByEmail(dto.email);

        if (existingUser) {
            throw new BadRequestException('Email already in use');
        }

        const passwordHash = await this.hashPassword(dto.password);
        const verificationToken = this.createVerificationToken();
        const verificationTokenExpiresAt = new Date(
            Date.now() + 24 * 60 * 60 * 1000,
        );

        const user = await this.usersService.createJobSeeker({
            email: dto.email,
            passwordHash,
            displayName: dto.displayName,
            location: dto.location,
            preferredJobCategories: dto.preferredJobCategories,
            verificationToken,
            verificationTokenExpiresAt,
        });
        const verificationPreviewUrl =
            this.buildVerificationPreviewUrl(verificationToken);

        console.log(
            `Job seeker verification email preview for ${user.email}: ${verificationPreviewUrl}`,
        );

        return {
            message:
                'Job seeker registered successfully. Please verify your email before logging in.',
            user: toAuthResponseUser(user),
            requiresVerification: true,
            verificationPreviewUrl,
        };
    }

    async registerEmployer(dto: RegisterEmployerDto) {
        const existingUser = await this.usersService.findByEmail(dto.email);

        if (existingUser) {
            throw new BadRequestException('Email already in use');
        }

        const passwordHash = await this.hashPassword(dto.password);
        const verificationToken = this.createVerificationToken();
        const verificationTokenExpiresAt = new Date(
            Date.now() + 24 * 60 * 60 * 1000,
        );

        const user = await this.usersService.createEmployer({
            email: dto.email,
            passwordHash,
            companyName: dto.companyName,
            description: dto.description,
            website: dto.website,
            industry: dto.industry,
            companySize: dto.companySize,
            verificationToken,
            verificationTokenExpiresAt,
        });
        const verificationPreviewUrl =
            this.buildVerificationPreviewUrl(verificationToken);

        console.log(
            `Employer verification email preview for ${user.email}: ${verificationPreviewUrl}`,
        );

        return {
            message:
                'Employer registered successfully. Please verify your email to unlock employer features.',
            user: toAuthResponseUser(user),
            requiresVerification: true,
            verificationPreviewUrl,
        };
    }

    async login(dto: LoginDto) {
        let user = await this.usersService.findByEmail(dto.email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('This account has been deactivated.');
        }

        if (user.lockoutUntil && user.lockoutUntil.getTime() <= Date.now()) {
            user = await this.usersService.resetLoginAttempts(user.id);
        }

        if (user.lockoutUntil && user.lockoutUntil.getTime() > Date.now()) {
            throw new UnauthorizedException({
                message: this.buildLockoutMessage(user.lockoutUntil),
                code: 'ACCOUNT_LOCKED',
                lockoutUntil: user.lockoutUntil.toISOString(),
            });
        }

        const passwordMatches = await this.comparePasswords(
            dto.password,
            user.passwordHash,
        );

        if (!passwordMatches) {
            const failedLoginAttempts = user.failedLoginAttempts + 1;
            const shouldLockAccount =
                failedLoginAttempts >= AuthService.MAX_FAILED_LOGIN_ATTEMPTS;
            const lockoutUntil = shouldLockAccount
                ? new Date(Date.now() + AuthService.LOCKOUT_DURATION_MS)
                : null;

            const updatedUser = await this.usersService.recordFailedLoginAttempt(
                user.id,
                failedLoginAttempts,
                lockoutUntil,
            );

            if (updatedUser.lockoutUntil) {
                throw new UnauthorizedException({
                    message: this.buildLockoutMessage(updatedUser.lockoutUntil),
                    code: 'ACCOUNT_LOCKED',
                    lockoutUntil: updatedUser.lockoutUntil.toISOString(),
                });
            }

            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
            user = await this.usersService.resetLoginAttempts(user.id);
        }

        if (user.role === UserRole.JOB_SEEKER && !user.isVerified) {
            throw new UnauthorizedException({
                message: 'Please verify your email before logging in.',
                code: 'EMAIL_NOT_VERIFIED',
                requiresVerification: true,
            });
        }

        const accessToken = this.signToken(user);

        return {
            message: 'Login successful',
            accessToken,
            user: toAuthResponseUser(user),
        };
    }

    async verifyEmail(token: string) {
        const user = await this.usersService.findByVerificationToken(token);

        if (!user) {
            throw new BadRequestException('Invalid verification token');
        }

        if (user.isVerified) {
            return {
                message: 'Email already verified',
            };
        }

        if (
            !user.verificationTokenExpiresAt ||
            user.verificationTokenExpiresAt.getTime() < Date.now()
        ) {
            throw new BadRequestException('Verification token has expired');
        }

        await this.usersService.verifyUserEmail(user.id);

        return {
            message: 'Email verified successfully. You can now log in.',
        };
    }

    async requestVerificationLink(userId: string): Promise<VerificationLinkResponse> {
        const user = await this.usersService.findById(userId);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (user.isVerified) {
            throw new BadRequestException('Email already verified');
        }

        const verificationToken = this.createVerificationToken();
        const verificationTokenExpiresAt = new Date(
            Date.now() + 24 * 60 * 60 * 1000,
        );

        await this.usersService.setVerificationToken(
            user.id,
            verificationToken,
            verificationTokenExpiresAt,
        );

        const verificationPreviewUrl =
            this.buildVerificationPreviewUrl(verificationToken);

        console.log(
            `Verification email preview regenerated for ${user.email}: ${verificationPreviewUrl}`,
        );

        return {
            message: 'Verification link generated successfully.',
            verificationPreviewUrl,
        };
    }

    async requestPasswordReset(
        dto: ForgotPasswordDto,
    ): Promise<ForgotPasswordResponse> {
        const user = await this.usersService.findByEmail(dto.email);
        const genericResponse: ForgotPasswordResponse = {
            message:
                'If an account with that email exists, a password reset link has been generated.',
        };

        if (!user) {
            return genericResponse;
        }

        const passwordResetToken = this.createVerificationToken();
        const passwordResetTokenExpiresAt = new Date(
            Date.now() + 60 * 60 * 1000,
        );

        await this.usersService.setPasswordResetToken(
            user.id,
            passwordResetToken,
            passwordResetTokenExpiresAt,
        );

        const resetPreviewUrl =
            this.buildPasswordResetPreviewUrl(passwordResetToken);

        console.log(
            `Password reset email preview for ${user.email}: ${resetPreviewUrl}`,
        );

        return {
            ...genericResponse,
            resetPreviewUrl,
        };
    }

    async resetPassword(dto: ResetPasswordDto): Promise<ResetPasswordResponse> {
        const user = await this.usersService.findByPasswordResetToken(dto.token);

        if (!user || !user.passwordResetTokenExpiresAt) {
            throw new BadRequestException('Invalid password reset token');
        }

        if (user.passwordResetTokenExpiresAt.getTime() < Date.now()) {
            await this.usersService.clearPasswordResetToken(user.id);
            throw new BadRequestException('Password reset token has expired');
        }

        const passwordHash = await this.hashPassword(dto.password);

        await this.usersService.resetPassword(user.id, passwordHash);

        return {
            message: 'Password reset successfully. Please log in with your new password.',
        };
    }

    async me(userId: string) {
        const user = await this.usersService.findById(userId);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        return toAuthResponseUser(user);
    }

    async deleteAccount(
        userId: string,
        dto: DeleteAccountDto,
    ): Promise<DeleteAccountResponse> {
        const user = await this.usersService.findAccountForDeletion(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const passwordMatches = await this.comparePasswords(
            dto.password,
            user.passwordHash,
        );

        if (!passwordMatches) {
            throw new UnauthorizedException('Password confirmation failed');
        }

        const requestedAt = new Date();
        const receiptCode = this.createDeletionReceiptCode();

        const storedCvPath = this.resolveStoredCvPath(user.cv?.fileUrl);

        if (storedCvPath) {
            try {
                await unlink(storedCvPath);
            } catch {
                // stored file may already be missing
            }
        }

        await this.usersService.deleteUserAccount(user.id);

        const audit = await this.usersService.createAccountDeletionAudit({
            receiptCode,
            deletedEmail: user.email,
            deletedRole: user.role,
            hadCv: Boolean(user.cv),
            requestedAt,
        });

        console.log(
            `[ACCOUNT_DELETION_RECEIPT:${receiptCode}] ${user.email} was permanently deleted at ${audit.completedAt.toISOString()}.`,
        );

        return {
            message: 'Account deleted successfully.',
            receiptCode,
            completedAt: audit.completedAt.toISOString(),
            summary:
                'Your account data was removed immediately and a deletion receipt was recorded for support follow-up.',
        };
    }
}
