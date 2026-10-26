import { strings } from '../../shared/config/strings';

/** Shown instead of the app when VITE_API_BASE_URL is missing or invalid. */
export function ConfigErrorPage() {
  return (
    <main className="login">
      <div className="panel login__form">
        <p className="brand-text">{strings.appName}</p>
        <p role="alert" className="error-text">
          {strings.errors.config}
        </p>
      </div>
    </main>
  );
}
