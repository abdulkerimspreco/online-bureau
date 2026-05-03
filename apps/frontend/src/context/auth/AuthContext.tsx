import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getMe,
  login as loginRequest,
  registerEmployer as registerEmployerRequest,
  registerJobSeeker as registerJobSeekerRequest,
  logout as logoutRequest,
} from "../../api/auth/auth.api";
import type {
  AuthUser,
  LoginPayload,
  RegisterJobSeekerPayload,
  RegisterEmployerPayload,
} from "../../api/auth/auth.types";
import type { AuthContextType } from "./AuthContext.types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshMe() {
    try {
      const me = await getMe();
      setUser(me as unknown as AuthUser);
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    async function bootstrapAuth() {
      try {
        await refreshMe();
      } finally {
        setIsLoading(false);
      }
    }

    bootstrapAuth();
  }, []);

  async function login(payload: LoginPayload) {
    await loginRequest(payload);
    await refreshMe();
  }

  async function registerJobSeeker(payload: RegisterJobSeekerPayload) {
    return registerJobSeekerRequest(payload);
  }

  async function registerEmployer(payload: RegisterEmployerPayload) {
    return registerEmployerRequest(payload);
  }

  async function logout() {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
    }
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      registerJobSeeker,
      registerEmployer,
      logout,
      refreshMe,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
