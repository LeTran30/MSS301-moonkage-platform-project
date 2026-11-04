import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Icon } from '@/shared/ui';
import { useCartTotalCount } from '../model/cartStore';
import styles from './CartBadge.module.css';

export function CartBadge() {
  const count = useCartTotalCount();
  return (
    <Link to={routes.base.cart} className={styles.badgeBtn} aria-label={`Giỏ hàng, ${count} sản phẩm`}>
      <Icon name="cart" size={20} />
      {count > 0 && <span className={styles.bubble}>{count > 99 ? '99+' : count}</span>}
    </Link>
  );
}
