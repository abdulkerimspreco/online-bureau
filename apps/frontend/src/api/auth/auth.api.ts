import { API } from './axios';
import type {
    AuthResponse,
    ForgotPasswordPayload,
    ForgotPasswordResponse,
    LoginPayload,
    DeleteAccountPayload,
    DeleteAccountResponse,
    RegisterEmployerPayload,
    RegisterJobSeekerPayload,
    ResetPasswordPayload,
    ResetPasswordResponse,
    VerificationLinkResponse,
    VerificationRegistrationResponse,
    VerifyEmailPayload,
    VerifyEmailResponse,
} from './auth.types'
export async function login(payload: LoginPayload) {
    const { data } = await API.post<AuthResponse>('/auth/login', payload)

    return data;
}

export async function registerJobSeeker(payload: RegisterJobSeekerPayload) {
    const { data } = await API.post<VerificationRegistrationResponse>('/auth/register/job-seeker', payload);

    return data;
}

export async function registerEmployer(payload: RegisterEmployerPayload) {
    const { data } = await API.post<VerificationRegistrationResponse>('/auth/register/employer', payload);

    return data;
}

export async function verifyEmail(payload: VerifyEmailPayload) {
    const { data } = await API.post<VerifyEmailResponse>('/auth/verify-email', payload);

    return data;
}

export async function requestPasswordReset(payload: ForgotPasswordPayload) {
    const { data } = await API.post<ForgotPasswordResponse>('/auth/forgot-password', payload);

    return data;
}

export async function resetPassword(payload: ResetPasswordPayload) {
    const { data } = await API.post<ResetPasswordResponse>('/auth/reset-password', payload);

    return data;
}

export async function requestVerificationLink() {
    const { data } = await API.post<VerificationLinkResponse>('/auth/verification-link');

    return data;
}

export async function getMe() {
    const { data } = await API.get<AuthResponse>('/auth/me');

    return data;
}

export async function logout() {
    const response = await API.post('/auth/logout');
    return response.data;
}

export async function deleteAccount(payload: DeleteAccountPayload) {
    const { data } = await API.post<DeleteAccountResponse>(
        '/auth/delete-account',
        payload,
    );

    return data;
}
