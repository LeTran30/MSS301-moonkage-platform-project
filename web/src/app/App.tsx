import { isConfigValid } from '@/shared/config';
import { ConfigErrorPage } from '@/pages/system/config-error';
import { AppRouter } from './routes';
import { AppProviders } from './providers';

/**
 * The root of the application.
 *
 * `isConfigValid()` is checked first: without `VITE_API_BASE_URL` (and without
 * demo mode) every screen would fail with an opaque network error, so the app
 * shows a screen that says which key is missing instead of a blank page.
 */
export function App() {
  if (!isConfigValid()) {
    return (
      <AppProviders>
        <ConfigErrorPage />
      </AppProviders>
    );
  }

  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
