import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/entities/user';
import { LoginForm } from '@/features/login';
import { homeRoute } from '@/shared/config/routes';

export function LoginPage() {
  const session = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? homeRoute;

  if (session) return <Navigate to={from} replace />;

  return <LoginForm onLoggedIn={() => navigate(from, { replace: true })} />;
}
