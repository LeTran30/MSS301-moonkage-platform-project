import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { routes } from '../../../shared/config/routes';
import { strings } from '../../../shared/config/strings';
import { Button } from '../../../shared/ui';
import { useAuth } from '../model/useAuth';
import { authStrings } from '../strings';
import { DemoAccounts } from './DemoAccounts';
import styles from './LoginForm.module.css';

/** E-mail or phone number and password (FR-02); `onLoggedIn` runs once the session is stored. */
export function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError(authStrings.missingFields);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login(username.trim(), password);
      onLoggedIn();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : strings.errors.server);
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate aria-labelledby="login-heading">
      <p className={styles.brand}>{strings.appName}</p>
      <h1 id="login-heading" className={styles.title}>
        {authStrings.title}
      </h1>

      <div className={styles.field}>
        <label htmlFor="login-username" className={styles.label}>
          {authStrings.username}
        </label>
        <input
          id="login-username"
          name="username"
          className={styles.input}
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'login-error' : undefined}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="login-password" className={styles.label}>
          {authStrings.password}
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          className={styles.input}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'login-error' : undefined}
        />
      </div>

      {error && (
        <p id="login-error" role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        className={styles.submitButton}
        disabled={submitting}
        busy={submitting}
      >
        {submitting ? authStrings.submitting : authStrings.submit}
      </Button>

      <p className={styles.footer}>
        <Link to={routes.forgotPassword} className={styles.footerLink}>
          Quên mật khẩu?
        </Link>{' '}
        · Chưa có tài khoản?{' '}
        <Link to={routes.register} className={styles.footerLink}>
          Đăng ký
        </Link>
      </p>

      <DemoAccounts
        onPick={(user, pass) => {
          setUsername(user);
          setPassword(pass);
          setError(null);
        }}
      />
    </form>
  );
}
