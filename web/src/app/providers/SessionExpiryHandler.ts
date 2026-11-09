/**
 * Sends the user to the sign-in page when the API client gives up on the
 * session (a 401 it could not recover from).
 *
 * Before this, the client only dropped the tokens: the page kept the old
 * profile, the action failed with a toast and the user was left on a page
 * that could no longer do anything.
 *
 * Why it subscribes to the router object, like `startPageViewTracking`:
 * `AppProviders` is the parent of `RouterProvider`, so no router hook can run
 * there. The router itself can navigate from outside the React tree.
 */
import { onSessionExpired, type SessionExpiryReason } from '@/shared/api';
import { routes } from '@/shared/config';
import { toast } from '@/shared/ui';
import { GUEST_USER, markAnonymous, userStore } from '@/entities/user';

const SESSION_EXPIRED_NOTICE = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
const SIGN_IN_REQUIRED_NOTICE = 'Vui lòng đăng nhập để tiếp tục.';

/** What of the router this handler uses. */
export interface ExpiryRouter {
  state: { location: { pathname: string; search: string; hash: string } };
  navigate: (
    to: string,
    options: { replace?: boolean; state?: unknown },
  ) => Promise<void> | void;
}

/** Start listening; returns the unsubscribe function (for tests). */
export function startSessionExpiryHandling(router: ExpiryRouter): () => void {
  return onSessionExpired((reason: SessionExpiryReason) => {
    userStore.set(GUEST_USER);
    markAnonymous();

    const location = router.state.location;
    // Several requests can fail together; only the first one moves the user.
    if (location.pathname === routes.auth.login) return;

    toast.info(reason === 'EXPIRED' ? SESSION_EXPIRED_NOTICE : SIGN_IN_REQUIRED_NOTICE);
    // `from` has the shape `RequireAuth` gives, so the sign-in page sends the
    // user back to where they were in both cases.
    void router.navigate(routes.auth.login, { state: { from: location } });
  });
}
