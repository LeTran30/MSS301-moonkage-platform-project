import { Link } from 'react-router-dom';
import { homeRoute } from '@/shared/config/routes';

export function NotFoundPage() {
  return (
    <div className="shop__inner page page--narrow">
      <h1 className="title-text">Không có trang này</h1>
      <Link to={homeRoute} className="mk-btn mk-btn--text">
        Về trang chủ
      </Link>
    </div>
  );
}
