import { useLocation, useNavigate } from 'react-router-dom';
import { ResetPasswordForm } from '../../features/auth';
import { routes } from '../../shared/config/routes';

/** M5.5 */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const email = (useLocation().state as { email?: string } | null)?.email ?? '';
  return (
    <main className="login">
      <ResetPasswordForm initialEmail={email} onDone={() => navigate(routes.login, { replace: true })} />
    </main>
  );
}
