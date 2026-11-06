/**
 * Token vault — the single owner of the access/refresh token pair.
 *
 * Why a vault instead of reading `localStorage` inside the Axios interceptor:
 *
 * - The token lives in **module memory** first. The interceptor reads it from
 *   here, never from the DOM storage.
 * - The only persistence is **sessionStorage**, so a token dies with the tab.
 *   `localStorage` kept the token alive for weeks after the user closed the
 *   browser, which is exactly the window an attacker wants.
 * - A token already sitting in `localStorage` (older release) is migrated once
 *   and then removed, so the old exposure disappears too.
 *
 * This lowers the blast radius of an XSS bug, but it is **not** a full fix:
 * script running inside the page can still read module memory. The only real
 * cure is an `HttpOnly; Secure; SameSite=Strict` cookie owned by the backend —
 * see `doc/danh-gia-fe-doanh-nghiep-2026-11-02.md` §8.
 */

const STORAGE_KEY = 'moonkage_session_tokens';

export interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
}

let accessToken: string | null = null;
let refreshToken: string | null = null;

const listeners = new Set<(token: string | null) => void>();

function notify(): void {
  listeners.forEach((listener) => listener(accessToken));
}

/**
 * Watch the session. The realtime socket has to be opened when a session
 * starts and closed when it ends, so it subscribes here instead of polling.
 */
export function subscribeToToken(listener: (token: string | null) => void): () => void {
  listeners.add(listener);
  listener(accessToken);
  return () => {
    listeners.delete(listener);
  };
}

/** Read the persisted pair, tolerating a blocked or corrupted storage. */
function readPersisted(): StoredTokens | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredTokens>;
    if (typeof parsed.accessToken !== 'string' || parsed.accessToken.length === 0) return null;
    return {
      accessToken: parsed.accessToken,
      refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken : undefined,
    };
  } catch {
    return null;
  }
}

function writePersisted(tokens: StoredTokens | null): void {
  try {
    if (tokens) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage is unavailable (private mode, blocked site data): memory only */
  }
}

/**
 * Move a token pair out of `localStorage` into the vault.
 *
 * Called once at start-up. Tokens written by an older release are still in
 * `localStorage`; they are copied over and deleted from there, so an old
 * install stops leaving a long-lived token behind.
 */
export function migrateLegacyTokens(): void {
  try {
    const legacyAccess = localStorage.getItem('moonkage_access_token');
    const legacyRefresh = localStorage.getItem('moonkage_refresh_token');
    if (!legacyAccess && !legacyRefresh) return;
    if (!accessToken && legacyAccess) {
      accessToken = legacyAccess;
      refreshToken = legacyRefresh;
      writePersisted({ accessToken, refreshToken: refreshToken ?? undefined });
    }
    localStorage.removeItem('moonkage_access_token');
    localStorage.removeItem('moonkage_refresh_token');
  } catch {
    /* ignore: the vault falls back to memory only */
  }
}

/** The access token of the current session, or `null` when nobody is signed in. */
export function getAccessToken(): string | null {
  if (!accessToken) {
    const persisted = readPersisted();
    if (persisted) {
      accessToken = persisted.accessToken;
      refreshToken = persisted.refreshToken ?? null;
    }
  }
  return accessToken;
}

/** The refresh token, or `null` when the session cannot be renewed. */
export function getRefreshToken(): string | null {
  if (!refreshToken) getAccessToken();
  return refreshToken;
}

/** Remember the token pair of a new session. */
export function storeTokens(access: string, refresh?: string): void {
  accessToken = access;
  refreshToken = refresh ?? null;
  writePersisted({ accessToken: access, refreshToken: refresh });
  notify();
}

/** Replace the token pair after a refresh, keeping the session alive. */
export function updateTokens(access: string, refresh?: string): void {
  accessToken = access;
  if (refresh) refreshToken = refresh;
  writePersisted({ accessToken: access, refreshToken: refreshToken ?? undefined });
  notify();
}

/** Forget the session. */
export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
  writePersisted(null);
  notify();
}
