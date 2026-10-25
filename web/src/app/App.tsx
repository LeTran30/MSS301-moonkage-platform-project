import type { ReactNode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider, useAuth } from '../features/auth';
import { CartProvider } from '../features/cart';
import { DeliveryAreaProvider } from '../features/delivery-area';
import { ConfigErrorPage } from '../pages/config-error/ConfigErrorPage';
import { RealtimeProvider } from '../shared/api/realtime/RealtimeProvider';
import { config, isConfigValid } from '../shared/config/env';
import { router } from './routes';

/** One STOMP connection for the logged-in account; none for a guest, and none in demo mode (no server). */
function SessionRealtime({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  return <RealtimeProvider token={config.demoMode ? null : (session?.token ?? null)}>{children}</RealtimeProvider>;
}

/** Providers of the whole app, outermost first: session, its realtime connection, delivery area, cart. */
export function App() {
  if (!isConfigValid()) return <ConfigErrorPage />;

  return (
    <AuthProvider>
      <SessionRealtime>
        <DeliveryAreaProvider>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </DeliveryAreaProvider>
      </SessionRealtime>
    </AuthProvider>
  );
}

export default App;
