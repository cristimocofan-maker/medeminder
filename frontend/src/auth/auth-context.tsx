import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { apiClient } from "../api/client";
import type { ApiSuccessResponse } from "../shared/types/api";
import type { AuthLoginRequest, AuthLogoutResponse, AuthSession } from "../shared/types/auth";
import { authSessionStorage } from "../shared/utils/storage";

const accessTokenStorageKey = "kidsrap.access_token";

const syncAccessTokenStorage = (session: AuthSession | null): void => {
  if (session === null) {
    window.localStorage.removeItem(accessTokenStorageKey);
    return;
  }

  window.localStorage.setItem(accessTokenStorageKey, session.access_token);
};

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (payload: AuthLoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedSession = authSessionStorage.read();

    setSession(storedSession);
    syncAccessTokenStorage(storedSession);
    setIsHydrated(true);
  }, []);

  const login = async (payload: AuthLoginRequest): Promise<void> => {
    const response = await apiClient.post<ApiSuccessResponse<AuthSession>>("/auth/login", payload);
    const nextSession = response.data.data;

    authSessionStorage.write(nextSession);
    syncAccessTokenStorage(nextSession);
    setSession(nextSession);
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.post<ApiSuccessResponse<AuthLogoutResponse>>("/auth/logout");
    } finally {
      authSessionStorage.clear();
      syncAccessTokenStorage(null);
      setSession(null);
    }
  };

  const value = useMemo<AuthContextValue>(() => {
    return {
      session,
      isAuthenticated: session !== null,
      isHydrated,
      login,
      logout,
    };
  }, [isHydrated, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};