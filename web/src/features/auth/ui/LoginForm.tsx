import { useState, type FormEvent } from 'react';
import { ApiError } from '../../../shared/api/client';
import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { strings } from '../../../shared/config/strings';
import { useAuth } from '../model/useAuth';
import { authStrings } from '../strings';
import { DemoAccounts } from './DemoAccounts';

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
    <form className="panel login__form" onSubmit={handleSubmit} noValidate aria-labelledby="login-heading">
      <p className="brand-text">{strings.appName}</p>
      <h1 id="login-heading" className="title-text">
        {authStrings.title}
      </h1>

      <div className="mk-field">
        <label htmlFor="login-username">{authStrings.username}</label>
        <input
          id="login-username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'login-error' : undefined}
        />
      </div>

      <div className="mk-field">
        <label htmlFor="login-password">{authStrings.password}</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'login-error' : undefined}
        />
      </div>

      {error && (
        <p id="login-error" role="alert" className="error-text">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="mk-btn mk-btn--primary"
        disabled={submitting}
        aria-busy={submitting || undefined}
      >
        {submitting ? authStrings.submitting : authStrings.submit}
      </button>

      <p className="auth-footer">
        <Link to={routes.forgotPassword}>Quên mật khẩu?</Link> · Chưa có tài khoản? <Link to={routes.register}>Đăng ký</Link>
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
