import { useLocation, useNavigate } from 'react-router-dom';
import { ConfirmAccountForm } from '@/features/register';
import { routes } from '@/shared/config/routes';

/** M5.3 */
export function ConfirmAccountPage() {
  const navigate = useNavigate();
  const email = (useLocation().state as { email?: string } | null)?.email ?? '';
  return <ConfirmAccountForm email={email} onConfirmed={() => navigate(routes.auth.login, { replace: true })} />;
}
