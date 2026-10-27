import { RouterProvider } from 'react-router-dom';
import { ConfigErrorPage } from '@/pages/system/config-error';
import { isConfigValid } from '@/shared/config/env';
import { AppProviders } from './providers';
import { router } from './routes';

/** Providers of the whole app, outermost first: session, its realtime connection, delivery area, cart. */
export function App() {
  if (!isConfigValid()) return <ConfigErrorPage />;

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}

export default App;
