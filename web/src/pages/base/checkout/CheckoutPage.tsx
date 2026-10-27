import { Navigate, useNavigate } from 'react-router-dom';
import { formatAddress, useAddresses } from '@/entities/address';
import { cartTotals, groupByShop } from '@/entities/cart';
import { CheckoutView, useCartItems } from '@/features/checkout';
import { startPayment } from '@/features/pay';
import { routes } from '@/shared/config/routes';
import { LoadingState } from '@/shared/ui';

/** M4.1: pay every shop's order in one VNPay payment; the orders are created on the result page. */
export function CheckoutPage() {
  const navigate = useNavigate();
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
  const groups = groupByShop(items);

  return (
    <div className="shop__inner page">
      <CheckoutView
        items={items}
        addresses={list.map((a) => ({ id: a.id, label: a.label, name: a.name, phone: a.phone, text: formatAddress(a), isDefault: a.isDefault }))}
        onAddAddress={() => navigate(routes.account.newAddress)}
        onBack={() => navigate(routes.base.cart)}
        onPay={async (address, invoice) => {
          const payment = await startPayment('checkout', cartTotals(groups).total, `Mua hàng có sẵn · ${groups.length} đơn`, {
            groups: groups.map((g) => ({
              shop: g.shopName,
              shippingFee: g.shippingFee,
              lines: g.items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
            })),
            address: { name: address.name, phone: address.phone, line: address.text },
            invoice,
          });
          navigate(routes.gateway.vnpay(payment.id));
        }}
      />
    </div>
  );
}
