import { useLocation, useNavigate } from 'react-router-dom';
import { ResetPasswordForm } from '@/features/reset-password';
import { routes } from '@/shared/config/routes';

/** M5.5 */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const email = (useLocation().state as { email?: string } | null)?.email ?? '';
  return <ResetPasswordForm initialEmail={email} onDone={() => navigate(routes.auth.login, { replace: true })} />;
}
