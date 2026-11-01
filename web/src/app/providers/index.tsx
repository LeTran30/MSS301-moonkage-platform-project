import type { ReactNode } from 'react';
import { CartProvider } from '@/entities/cart';
import { useCurrentUser } from '@/entities/user';
import { SessionProvider } from '@/entities/user';
import { DeliveryAreaProvider, useDeliveryArea } from '@/features/choose-delivery-area';
import { RealtimeProvider } from '@/shared/api/realtime/RealtimeProvider';
import { config } from '@/shared/config/env';

/** One STOMP connection for the logged-in account; none for a guest, and none in demo mode (no server). */
function SessionRealtime({ children }: { children: ReactNode }) {
  const session = useCurrentUser();
  return <RealtimeProvider token={config.demoMode ? null : (session?.token ?? null)}>{children}</RealtimeProvider>;
}

/** The logged-in account's cart, priced to the chosen delivery area. */
function SessionCart({ children }: { children: ReactNode }) {
  const session = useCurrentUser();
  const { provinceCode } = useDeliveryArea();
  return (
    <CartProvider accountId={session?.accountId ?? null} provinceCode={provinceCode}>
      {children}
    </CartProvider>
  );
}

/** Providers of the whole app, outermost first: session, its realtime connection, delivery area, cart. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SessionRealtime>
        <DeliveryAreaProvider>
          <SessionCart>{children}</SessionCart>
        </DeliveryAreaProvider>
      </SessionRealtime>
    </SessionProvider>
  );
}
