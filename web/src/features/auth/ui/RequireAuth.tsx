import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { useAuth } from '../model/useAuth';

/** Sends a logged-out visitor to the login page, then back here after logging in. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();
  if (!session) return <Navigate to={routes.login} replace state={{ from: location.pathname }} />;
  return children;
}
