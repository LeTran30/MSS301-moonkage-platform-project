import { useCallback, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { login as loginRequest } from '../api/auth';
import { configureAuth } from '../api/client';
import { AuthContext, type AuthSession } from './authContext';

const STORAGE_KEY = 'moonkage.session';

/** Storage can be missing or throw (private window, blocked site data): the app then just forgets on reload. */
function readStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    return parsed.token && parsed.accountId
      ? { token: parsed.token, accountId: parsed.accountId, displayName: parsed.displayName ?? '' }
      : null;
  } catch {
    return null;
  }
}

function storeSession(session: AuthSession | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // keep working with the in-memory session
  }
}

/**
 * Holds the access token for the whole app. No refresh yet: when the server answers 401 the user logs in again.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(readStoredSession);

  const logout = useCallback(() => {
    storeSession(null);
    setSession(null);
  }, []);

  // layout effect: the token must be in the client before any child effect sends a request
  useLayoutEffect(() => {
    configureAuth(session?.token ?? null, logout);
  }, [session, logout]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await loginRequest(username, password);
    const next: AuthSession = {
      token: response.token,
      accountId: response.accountId,
      displayName: response.fullName || response.email || username,
    };
    storeSession(next);
    setSession(next);
  }, []);

  const value = useMemo(() => ({ session, login, logout }), [session, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
