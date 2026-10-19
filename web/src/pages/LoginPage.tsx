import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { homeRoute } from '../routes';
import { strings } from '../strings';

export function LoginPage() {
  const { session, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? homeRoute;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session) return <Navigate to={from} replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError(strings.login.missingFields);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : strings.errors.server);
      setSubmitting(false);
    }
  };

  return (
    <main className="login">
      <form className="panel login__form" onSubmit={handleSubmit} noValidate aria-labelledby="login-heading">
        <p className="brand-text">{strings.appName}</p>
        <h1 id="login-heading" className="title-text">
          {strings.login.title}
        </h1>

        <div className="mk-field">
          <label htmlFor="login-username">{strings.login.username}</label>
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
          <label htmlFor="login-password">{strings.login.password}</label>
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
          {submitting ? strings.login.submitting : strings.login.submit}
        </button>
      </form>
    </main>
  );
}
