import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from '@/entities/user';
import { routes } from '@/shared/config';

interface Props {
  children: ReactNode;
}

export function RequireNfc({ children }: Props) {
  const user = useCurrentUser();
  const location = useLocation();

  if (user.nfcStatus !== 'VERIFIED') {
    return (
      <Navigate
        to={routes.account.verify}
        state={{
          returnUrl: location.pathname + location.search + location.hash,
          from: location,
        }}
        replace
      />
    );
  }

  return <>{children}</>;
}
