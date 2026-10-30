import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '@/features/register';
import { routes } from '@/shared/config/routes';

/** M5.2 */
export function RegisterPage() {
  const navigate = useNavigate();
  return <RegisterForm onRegistered={(email) => navigate(routes.auth.confirmAccount, { state: { email } })} />;
}
