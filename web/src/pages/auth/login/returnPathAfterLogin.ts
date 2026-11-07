import { routes } from '@/shared/config';

interface FromLocation {
  pathname: string;
  search?: string;
  hash?: string;
}

/**
 * Where to go after signing in: the page `RequireAuth` or the session-expiry
 * handler sent the user from, else the account overview. Only an in-app path
 * is followed, and never the sign-in page itself.
 */
export function returnPathAfterLogin(state: unknown): string {
  const from = (state as { from?: FromLocation } | null)?.from;
  const pathname = from?.pathname;
  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//')) {
    return routes.account.overview;
  }
  if (pathname === routes.auth.login) return routes.account.overview;
  return `${pathname}${from.search ?? ''}${from.hash ?? ''}`;
}
