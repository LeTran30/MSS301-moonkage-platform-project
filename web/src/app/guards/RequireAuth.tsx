import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from '@/entities/user';
import { routes } from '@/shared/config';

interface Props {
  children: ReactNode;
}

export function RequireAuth({ children }: Props) {
  const user = useCurrentUser();
  const location = useLocation();

  if (!user || !user.id) {
    return <Navigate to={routes.auth.login} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
