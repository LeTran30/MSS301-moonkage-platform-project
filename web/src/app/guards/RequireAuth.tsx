import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser, useIsRestoringSession } from '@/entities/user';
import { routes } from '@/shared/config';
import { PageLoader } from '@/shared/ui';

interface Props {
  children: ReactNode;
}

export function RequireAuth({ children }: Props) {
  const user = useCurrentUser();
  const restoring = useIsRestoringSession();
  const location = useLocation();

  // Đang khôi phục phiên: chưa biết người dùng là ai, nên **chờ** chứ chưa
  // chuyển hướng. Nếu không, một lần F5 trên trang bảo vệ sẽ đá người dùng
  // đang đăng nhập ra trang đăng nhập.
  if (restoring) {
    return <PageLoader />;
  }

  if (!user.id) {
    return <Navigate to={routes.auth.login} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
