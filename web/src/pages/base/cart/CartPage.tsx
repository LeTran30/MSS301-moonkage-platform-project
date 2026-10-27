import { useNavigate } from 'react-router-dom';
import { CartView, useCartItems } from '@/features/checkout';
import { routes } from '@/shared/config/routes';
import { LoadingState } from '@/shared/ui';

/** M4.0 */
export function CartPage() {
  const navigate = useNavigate();
  const { loading, items } = useCartItems();
  return (
    <div className="shop__inner page">
      {loading ? <LoadingState /> : <CartView items={items} onContinue={() => navigate(routes.base.checkout)} />}
    </div>
  );
}
