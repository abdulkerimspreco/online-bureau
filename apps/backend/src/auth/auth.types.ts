export interface AuthResponseUser {
  id: string;
  email: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
}

export type DeliveryMethod = 'EMAIL' | 'PREVIEW';

export interface VerificationRegistrationResponse {
  message: string;
  user: AuthResponseUser;
  requiresVerification: boolean;
  deliveryMethod: DeliveryMethod;
  verificationPreviewUrl?: string;
}

export interface ForgotPasswordResponse {
  message: string;
  deliveryMethod: DeliveryMethod;
  resetPreviewUrl?: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface VerificationLinkResponse {
  message: string;
  deliveryMethod: DeliveryMethod;
  verificationPreviewUrl?: string;
}

export interface DeleteAccountResponse {
  message: string;
  receiptCode: string;
  completedAt: string;
  summary: string;
}
