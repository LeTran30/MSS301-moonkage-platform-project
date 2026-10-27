import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { configureAuth } from '../../../shared/api/client';
import { config } from '../../../shared/config/env';
import { demoAccount } from '../api/demoAccounts';
import { fetchMySellerStatus, getMyAccount, login as loginRequest, refreshAuthToken } from '../api/login';
import { AuthContext, type AuthSession } from './authContext';

const STORAGE_KEY = 'moonkage.session';

/** Storage can be missing or throw (private window, blocked site data): the app then just forgets on reload. */
function readStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    return parsed.token && parsed.accountId
      ? {
          token: parsed.token,
          refreshToken: parsed.refreshToken,
          accountId: parsed.accountId,
          email: parsed.email,
          displayName: parsed.displayName ?? '',
          sellerStatus: parsed.sellerStatus ?? 'none',
          isAdmin: parsed.isAdmin ?? false,
        }
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
 * Holds the access token and refresh token for the whole app, and resolves seller status in real API mode.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(readStoredSession);
  const sessionRef = useRef<AuthSession | null>(session);

  const logout = useCallback(() => {
    storeSession(null);
    setSession(null);
  }, []);

  const handleRefreshToken = useCallback(async (): Promise<string | null> => {
    const current = sessionRef.current;
    if (!current?.refreshToken || config.demoMode) return null;
    try {
      const refreshed = await refreshAuthToken(current.refreshToken);
      const next: AuthSession = {
        ...current,
        token: refreshed.token,
        refreshToken: refreshed.refreshToken || current.refreshToken,
        displayName: refreshed.fullName || current.displayName,
        email: refreshed.email || current.email,
      };
      storeSession(next);
      setSession(next);
      return next.token;
    } catch {
      return null;
    }
  }, []);

  // layout effect: the token must be in the client before any child effect sends a request
  useLayoutEffect(() => {
    sessionRef.current = session;
    configureAuth(session?.token ?? null, logout, handleRefreshToken);
  }, [session, logout, handleRefreshToken]);

  const refreshSellerStatus = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || current.isAdmin) return;
    const status = await fetchMySellerStatus();
    setSession((prev) => {
      if (!prev || prev.sellerStatus === status) return prev;
      const next = { ...prev, sellerStatus: status };
      storeSession(next);
      return next;
    });
  }, []);

  const updateDisplayName = useCallback((displayName: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, displayName };
      storeSession(next);
      return next;
    });
  }, []);

  // Sync account profile & sellerStatus on initial load when in real API mode
  useEffect(() => {
    if (config.demoMode || !session?.token) return;
    let cancelled = false;
    void (async () => {
      try {
        const [account, sellerStatus] = await Promise.all([
          getMyAccount().catch(() => null),
          session.isAdmin ? Promise.resolve<'none'>('none') : fetchMySellerStatus(),
        ]);
        if (cancelled) return;
        setSession((prev) => {
          if (!prev) return prev;
          const next: AuthSession = {
            ...prev,
            email: account?.email || prev.email,
            displayName: account?.fullName || prev.displayName,
            sellerStatus,
          };
          storeSession(next);
          return next;
        });
      } catch {
        // ignore background sync errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.token, session?.isAdmin]);

  const login = useCallback(
    async (username: string, password: string) => {
      const response = await loginRequest(username, password);
      const isAdmin = response.role.toUpperCase().includes('ADMIN');
      // Configure token immediately so fetchMySellerStatus can authenticate
      configureAuth(response.token, logout, handleRefreshToken);
      const sellerStatus = config.demoMode
        ? (demoAccount(username)?.sellerStatus ?? 'none')
        : isAdmin
          ? 'none'
          : await fetchMySellerStatus();
      const next: AuthSession = {
        token: response.token,
        refreshToken: response.refreshToken,
        accountId: response.accountId,
        email: response.email || (username.includes('@') ? username : undefined),
        displayName: response.fullName || response.email || username,
        sellerStatus,
        isAdmin,
      };
      storeSession(next);
      setSession(next);
    },
    [logout, handleRefreshToken],
  );

  const value = useMemo(
    () => ({ session, login, logout, refreshSellerStatus, updateDisplayName }),
    [session, login, logout, refreshSellerStatus, updateDisplayName],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
