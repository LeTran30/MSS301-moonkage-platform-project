import { Outlet, ScrollRestoration } from 'react-router-dom';
import { VendorBar } from '@/widgets/vendor-bar';
import { VendorChannelGate } from '@/widgets/vendor-channel-gate';

/** Frame of Kênh người bán: only for vendor accounts (VendorChannelGate), VendorBar widget, main content. */
export function VendorLayout() {
  return (
    <VendorChannelGate>
      <div className="shop">
        <ScrollRestoration />
        <VendorBar />
        <main className="shop__inner page">
          <Outlet />
        </main>
      </div>
    </VendorChannelGate>
  );
}
