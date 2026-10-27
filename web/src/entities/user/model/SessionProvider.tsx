import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { configureAuth } from '@/shared/api/client';
import { config } from '@/shared/config/env';
import { fetchMyVendorStatus, getMyAccount, refreshAuthToken } from '../api/sessionApi';
import { UserContext, type UserContextValue, type UserSession } from './userContext';

const STORAGE_KEY = 'moonkage.session';

/** Storage can be missing or throw (private window, blocked site data): the app then just forgets on reload. */
function readStoredSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserSession> & { sellerStatus?: UserSession['vendorStatus'] };
    return parsed.token && parsed.accountId
      ? {
          token: parsed.token,
          refreshToken: parsed.refreshToken,
          accountId: parsed.accountId,
          email: parsed.email,
          displayName: parsed.displayName ?? '',
          // sessions stored before the seller → vendor rename keep their status under `sellerStatus`
          vendorStatus: parsed.vendorStatus ?? parsed.sellerStatus ?? 'none',
          isAdmin: parsed.isAdmin ?? false,
        }
      : null;
  } catch {
    return null;
  }
}

function storeSession(session: UserSession | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // keep working with the in-memory session
  }
}

/**
 * Holds the access token and refresh token for the whole app, and resolves vendor status in real API mode.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(readStoredSession);
  const sessionRef = useRef<UserSession | null>(session);

  const logout = useCallback(() => {
    storeSession(null);
    setSession(null);
  }, []);

  const handleRefreshToken = useCallback(async (): Promise<string | null> => {
    const current = sessionRef.current;
    if (!current?.refreshToken || config.demoMode) return null;
    try {
      const refreshed = await refreshAuthToken(current.refreshToken);
      const next: UserSession = {
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

  const refreshVendorStatus = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || current.isAdmin) return;
    const status = await fetchMyVendorStatus();
    setSession((prev) => {
      if (!prev || prev.vendorStatus === status) return prev;
      const next = { ...prev, vendorStatus: status };
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

  // Sync account profile & vendorStatus on initial load when in real API mode
  useEffect(() => {
    if (config.demoMode || !session?.token) return;
    let cancelled = false;
    void (async () => {
      try {
        const [account, vendorStatus] = await Promise.all([
          getMyAccount().catch(() => null),
          session.isAdmin ? Promise.resolve<'none'>('none') : fetchMyVendorStatus(),
        ]);
        if (cancelled) return;
        setSession((prev) => {
          if (!prev) return prev;
          const next: UserSession = {
            ...prev,
            email: account?.email || prev.email,
            displayName: account?.fullName || prev.displayName,
            vendorStatus,
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

  const startSession = useCallback<UserContextValue['startSession']>(
    async (next) => {
      // the token must be in the client before the vendor status is asked for
      configureAuth(next.token, logout, handleRefreshToken);
      const session: UserSession = { ...next, vendorStatus: next.vendorStatus ?? (await fetchMyVendorStatus()) };
      storeSession(session);
      setSession(session);
    },
    [logout, handleRefreshToken],
  );

  const value = useMemo(
    () => ({ session, startSession, logout, refreshVendorStatus, updateDisplayName }),
    [session, startSession, logout, refreshVendorStatus, updateDisplayName],
  );
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
