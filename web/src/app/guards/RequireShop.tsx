import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentUser, useIsRestoringSession } from '@/entities/user';
import { routes } from '@/shared/config';
import { PageLoader } from '@/shared/ui';

interface Props {
  children: ReactNode;
}

/**
 * The seller channel is for an account that owns a Shop (FR-27).
 *
 * The session profile names the Shop (`vendorId`) before the session counts as restored, so the guard waits
 * for that and sends an account without a Shop to the page that explains how to open one. The backend refuses
 * every Shop action of such an account anyway; the guard keeps the buyer out of screens they cannot use.
 */
export function RequireShop({ children }: Props) {
  const user = useCurrentUser();
  const restoring = useIsRestoringSession();

  if (restoring) {
    return <PageLoader />;
  }

  if (!user.vendorId) {
    return <Navigate to={routes.base.sellIntro} replace />;
  }

  return <>{children}</>;
}
