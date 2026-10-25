import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LoginForm, useAuth } from '../../features/auth';
import { homeRoute } from '../../shared/config/routes';

export function LoginPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? homeRoute;

  if (session) return <Navigate to={from} replace />;

  return (
    <main className="login">
      <LoginForm onLoggedIn={() => navigate(from, { replace: true })} />
    </main>
  );
}
