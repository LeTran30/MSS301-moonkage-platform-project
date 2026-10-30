import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '@/entities/user';
import { VendorChannelContext, useVendorProfile } from '@/entities/vendor';
import { routes } from '@/shared/config/routes';
import { LoadingState } from '@/shared/ui';

/**
 * Kênh người bán is for accounts with a vendor profile: the others are sent to "Bán hàng trên Moonkage". Loads the
 * profile once and hands it to everything inside (`useVendorContext`).
 */
export function VendorChannelGate({ children }: { children: ReactNode }) {
  const session = useCurrentUser();
  const profile = useVendorProfile();
  if (!session || session.vendorStatus === 'none') {
    return (
      <div className="shop__inner page page--narrow">
        <h1 className="title-text">Kênh người bán chỉ dành cho người bán</h1>
        <p className="lead-text">Tài khoản này chưa có hồ sơ người bán.</p>
        <Link to={routes.base.sellIntro} className="mk-btn mk-btn--primary">
          Xem Bán hàng trên Moonkage
        </Link>
      </div>
    );
  }
  if (profile.kind !== 'loaded') return <LoadingState />;
  return (
    <VendorChannelContext.Provider value={{ profile: profile.data, reload: profile.reload }}>{children}</VendorChannelContext.Provider>
  );
}
