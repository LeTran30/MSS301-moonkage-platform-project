import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { RequireAuth } from './auth/RequireAuth';
import { AppShell } from './components/AppShell';
import { isConfigValid } from './config';
import { LoginPage } from './pages/LoginPage';
import { VerifyNfcPage } from './pages/VerifyNfcPage';
import { RealtimeProvider } from './realtime/RealtimeProvider';
import { homeRoute, routes } from './routes';
import { strings } from './strings';

function NotFoundPage() {
  return (
    <div className="page">
      <h1 className="title-text">{strings.notFound.title}</h1>
      <Link to={homeRoute} className="mk-btn mk-btn--text">
        {strings.notFound.back}
      </Link>
    </div>
  );
}

function ConfigErrorPage() {
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

export function App() {
  if (!isConfigValid()) return <ConfigErrorPage />;

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path={routes.login} element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <RealtimeProvider>
                  <AppShell />
                </RealtimeProvider>
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to={homeRoute} replace />} />
            <Route path={routes.verifyNfc} element={<VerifyNfcPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
