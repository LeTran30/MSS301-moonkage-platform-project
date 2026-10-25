import { useNavigate } from 'react-router-dom';
import { ResetPasswordForm } from '../../features/auth';
import { routes } from '../../shared/config/routes';

/** M5.5 */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  return (
    <main className="login">
      <ResetPasswordForm onDone={() => navigate(routes.login, { replace: true })} />
    </main>
  );
}
