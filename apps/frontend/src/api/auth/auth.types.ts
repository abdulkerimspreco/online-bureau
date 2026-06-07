export interface AuthUser {
  id: string;
  email: string;
  role: 'JOB_SEEKER' | 'EMPLOYER' | 'ADMIN';
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
  accessToken?: string;
}

export interface RegistrationResponse {
  message: string;
  user: AuthUser;
}

export interface VerificationRegistrationResponse extends RegistrationResponse {
  requiresVerification: boolean;
  verificationPreviewUrl: string;
}

export interface VerifyEmailPayload {
  token: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetPreviewUrl?: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface VerificationLinkResponse {
  message: string;
  verificationPreviewUrl: string;
}

export interface DeleteAccountPayload {
  password: string;
}

export interface DeleteAccountResponse {
  message: string;
  receiptCode: string;
  completedAt: string;
  summary: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterJobSeekerPayload {
  email: string;
  password: string;
  displayName?: string;
  location?: string;
  preferredJobCategories?: string;
  acceptedTermsAndPrivacy: boolean;
}

export interface RegisterEmployerPayload {
  email: string;
  password: string;
  companyName: string;
  description?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  acceptedTermsAndPrivacy: boolean;
}
