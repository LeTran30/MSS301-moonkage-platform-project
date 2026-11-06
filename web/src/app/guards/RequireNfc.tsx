import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser, useIsRestoringSession } from '@/entities/user';
import { routes } from '@/shared/config';
import { PageLoader } from '@/shared/ui';

interface Props {
  children: ReactNode;
}

export function RequireNfc({ children }: Props) {
  const user = useCurrentUser();
  const restoring = useIsRestoringSession();
  const location = useLocation();

  // Đang khôi phục phiên: trạng thái định danh chưa biết, nên chưa thể kết
  // luận người dùng chưa định danh.
  if (restoring) {
    return <PageLoader />;
  }

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
