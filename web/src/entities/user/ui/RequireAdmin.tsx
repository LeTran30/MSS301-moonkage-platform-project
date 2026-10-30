import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/config/routes';
import { hasRole, useCurrentUser } from '../model/userContext';

/** Quản trị is for admin accounts only; anyone else is offered the way back to the buying area. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const session = useCurrentUser();
  if (!hasRole(session, 'admin')) {
    return (
      <div className="shop__inner page page--narrow">
        <h1 className="title-text">Khu quản trị chỉ dành cho quản trị viên</h1>
        <Link to={routes.base.home} className="mk-btn mk-btn--primary">
          Về trang mua hàng
        </Link>
      </div>
    );
  }
  return children;
}
