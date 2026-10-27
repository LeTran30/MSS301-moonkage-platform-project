import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { routes } from '@/shared/config/routes';
import { useSession } from '../model/userContext';

/** Sends a logged-out visitor to the login page, then back here after logging in. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const location = useLocation();
  if (!session) return <Navigate to={routes.auth.login} replace state={{ from: location.pathname }} />;
  return children;
}
