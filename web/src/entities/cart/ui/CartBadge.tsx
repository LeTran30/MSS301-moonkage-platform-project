import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Icon } from '@/shared/ui';
import { useDeliveryProvinceCode } from '@/entities/region/@x/cart';
import { useCartFor } from '../model/useCartQueries';
import styles from './CartBadge.module.css';

export function CartBadge() {
  // Con đếm đến từ **API thật** (`GET /api/carts/me`), nên badge và trang
  // giỏ hàng luôn thấy cùng một con số.
  const provinceCode = useDeliveryProvinceCode();
  const asyncCart = useCartFor(provinceCode);

  const count =
    asyncCart.kind === 'loaded'
      ? asyncCart.data.groups.reduce(
          (acc, group) => acc + group.items.reduce((sum, item) => sum + item.quantity, 0),
          0,
        )
      : 0;

  return (
    <Link
      to={routes.base.cart}
      className={styles.badgeBtn}
      aria-label={`Giỏ hàng, ${count} sản phẩm`}
    >
      <Icon name="cart" size={20} />
      {count > 0 && <span className={styles.bubble}>{count > 99 ? '99+' : count}</span>}
    </Link>
  );
}
