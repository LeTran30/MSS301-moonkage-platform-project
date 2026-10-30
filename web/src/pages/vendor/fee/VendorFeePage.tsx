import { useNavigate } from 'react-router-dom';
import { useVendorContext } from '@/entities/vendor';
import { VENDOR_FEE } from '@/entities/vendor';
import { startPayment } from '@/features/pay';
import { VendorFee } from '@/features/pay-vendor-fee';
import { routes } from '@/shared/config/routes';
import { EmptyState } from '@/shared/ui';

/** B1.1 */
export function VendorFeePage() {
  const profile = useVendorContext();
  const navigate = useNavigate();
  if (profile.state !== 'approved') return <EmptyState title={profile.state === 'open' ? 'Đã đóng phí mở bán' : 'Đóng phí sau khi hồ sơ được duyệt'} />;
  return (
    <VendorFee
      profile={profile}
      onLater={() => navigate(routes.vendor.overview)}
      onPay={async () => {
        const payment = await startPayment('vendor-fee', VENDOR_FEE, `Phí mở bán · ${profile.shopName}`);
        navigate(routes.gateway.vnpay(payment.id));
      }}
    />
  );
}
