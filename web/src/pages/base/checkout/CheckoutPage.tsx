import { Navigate, useNavigate } from 'react-router-dom';
import { formatAddress, formatAddressDetail, useAddresses } from '@/entities/address';
import { CheckoutView, payCart, useCartItems } from '@/features/checkout';
import { useOpenPayment } from '@/features/pay';
import { routes } from '@/shared/config/routes';
import { provinceCodeOf } from '@/shared/config/provinces';
import { LoadingState } from '@/shared/ui';

/** M4.1: pay every shop's order in one VNPay payment; the orders exist once the payment succeeds. */
export function CheckoutPage() {
  const navigate = useNavigate();
  const openPayment = useOpenPayment();
  const { loading, items } = useCartItems();
  const addresses = useAddresses();
  if (loading || addresses.kind === 'loading') {
    return (
      <div className="shop__inner page">
        <LoadingState />
      </div>
    );
  }
  if (!items.length) return <Navigate to={routes.base.cart} replace />;
  const list = addresses.kind === 'loaded' ? addresses.data : [];

  return (
    <div className="shop__inner page">
      <CheckoutView
        items={items}
        addresses={list.map((a) => ({
          id: a.id,
          label: a.label,
          name: a.name,
          phone: a.phone,
          text: formatAddress(a),
          provinceCode: a.provinceCode || provinceCodeOf(a.province),
          detail: formatAddressDetail(a),
          isDefault: a.isDefault,
        }))}
        onAddAddress={() => navigate(routes.account.newAddress)}
        onBack={() => navigate(routes.base.cart)}
        onPay={async (address, invoice) => openPayment(await payCart(items, address, invoice))}
      />
    </div>
  );
}
