export interface AuthResponseUser {
  id: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface VerificationRegistrationResponse {
  message: string;
  user: AuthResponseUser;
  requiresVerification: boolean;
  verificationPreviewUrl: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetPreviewUrl?: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface VerificationLinkResponse {
  message: string;
  verificationPreviewUrl: string;
}
