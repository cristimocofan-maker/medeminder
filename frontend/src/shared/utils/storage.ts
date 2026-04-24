import type { AuthSession } from "../types/auth";

const sessionStorageKey = import.meta.env.VITE_SESSION_STORAGE_KEY;

const decodeJwtPayload = (token: string): { exp?: number } | null => {
  const tokenParts = token.split(".");

  if (tokenParts.length < 2) {
    return null;
  }

  try {
    const normalizedPayload = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, "=");
    const decodedPayload = window.atob(paddedPayload);

    return JSON.parse(decodedPayload) as { exp?: number };
  } catch {
    return null;
  }
};

const isSessionExpired = (session: AuthSession): boolean => {
  const payload = decodeJwtPayload(session.access_token);

  if (payload?.exp === undefined || !Number.isFinite(payload.exp)) {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
};

export const authSessionStorage = {
  read(): AuthSession | null {
    const rawValue = window.sessionStorage.getItem(sessionStorageKey);

    if (rawValue === null) {
      return null;
    }

    try {
      const parsedSession = JSON.parse(rawValue) as AuthSession;

      if (isSessionExpired(parsedSession)) {
        window.sessionStorage.removeItem(sessionStorageKey);
        return null;
      }

      return parsedSession;
    } catch {
      window.sessionStorage.removeItem(sessionStorageKey);
      return null;
    }
  },
  write(session: AuthSession): void {
    window.sessionStorage.setItem(sessionStorageKey, JSON.stringify(session));
  },
  clear(): void {
    window.sessionStorage.removeItem(sessionStorageKey);
  },
};