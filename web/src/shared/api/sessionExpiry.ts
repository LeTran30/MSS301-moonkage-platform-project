/**
 * The session-expired signal of the API client.
 *
 * The client finds out that a session is gone (a 401 it cannot recover from),
 * but `shared/` must not reach the user store or the router. It only raises
 * this signal; the app layer listens, resets the user and sends them to the
 * sign-in page.
 */

/** Why the client gave up on the session. */
export type SessionExpiryReason =
  /** There was a session and the server no longer accepts it. */
  | 'EXPIRED'
  /** There was no session: a guest tried something that needs one. */
  | 'SIGN_IN_REQUIRED';

type Listener = (reason: SessionExpiryReason) => void;

const UNAUTHORIZED = 401;

const listeners = new Set<Listener>();

/** Listen for the end of the session; returns the unsubscribe function. */
export function onSessionExpired(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Whether a failed request ended because the user must sign in. The app
 * already tells the user and moves them to the sign-in page, so the caller
 * should not show its own error on top.
 */
export function isSessionEnded(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { status?: unknown }).status === UNAUTHORIZED
  );
}

/** Tell every listener that the session ended. */
export function notifySessionExpired(reason: SessionExpiryReason): void {
  listeners.forEach((listener) => listener(reason));
}
