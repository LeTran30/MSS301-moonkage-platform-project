import { useNavigate } from 'react-router-dom';
import { useVendorContext } from '@/entities/vendor';
import { useOpenPayment } from '@/features/pay';
import { payVendorFee, VendorFee } from '@/features/pay-vendor-fee';
import { routes } from '@/shared/config/routes';
import { EmptyState } from '@/shared/ui';

/** B1.1 */
export function VendorFeePage() {
  const profile = useVendorContext();
  const navigate = useNavigate();
  const openPayment = useOpenPayment();
  if (profile.state !== 'approved') return <EmptyState title={profile.state === 'open' ? 'Đã đóng phí mở bán' : 'Đóng phí sau khi hồ sơ được duyệt'} />;
  return (
    <VendorFee
      profile={profile}
      onLater={() => navigate(routes.vendor.overview)}
      onPay={async () => openPayment(await payVendorFee(profile.shopName))}
    />
  );
}
