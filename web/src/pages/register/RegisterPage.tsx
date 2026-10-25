import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../../features/auth';
import { routes } from '../../shared/config/routes';

/** M5.2 */
export function RegisterPage() {
  const navigate = useNavigate();
  return (
    <main className="login">
      <RegisterForm onRegistered={(email) => navigate(routes.confirmAccount, { state: { email } })} />
    </main>
  );
}
