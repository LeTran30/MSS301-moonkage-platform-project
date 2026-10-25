import { useNavigate } from 'react-router-dom';
import { CartView } from '../../features/cart';
import { routes } from '../../shared/config/routes';
import { LoadingState } from '../../shared/ui';
import { useCartItems } from '../useCartItems';

/** M4.0 */
export function CartPage() {
  const navigate = useNavigate();
  const { loading, items } = useCartItems();
  return <div className="shop__inner">{loading ? <LoadingState /> : <CartView items={items} onContinue={() => navigate(routes.checkout)} />}</div>;
}
