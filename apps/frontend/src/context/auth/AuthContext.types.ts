import type {
    AuthUser,
    LoginPayload,
    RegisterEmployerPayload,
    RegisterJobSeekerPayload,
    VerificationRegistrationResponse,
} from "../../api/auth/auth.types";

export interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (payload: LoginPayload) => Promise<void>;
    registerJobSeeker: (
        payload: RegisterJobSeekerPayload,
    ) => Promise<VerificationRegistrationResponse>;
    registerEmployer: (
        payload: RegisterEmployerPayload,
    ) => Promise<VerificationRegistrationResponse>;
    logout: () => void;
    refreshMe: () => Promise<void>;
}
