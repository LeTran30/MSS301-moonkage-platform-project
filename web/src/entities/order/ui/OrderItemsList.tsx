import { formatCurrency } from '@/shared/utils';
import { Card } from '@/shared/ui';
import type { Order } from '../model/types';
import styles from './OrderItemsList.module.css';

interface OrderItemsListProps {
  order: Order;
}

/** Danh sách mặt hàng trong đơn kèm tiền. */
export function OrderItemsList({ order }: OrderItemsListProps) {
  return (
    <Card padding="md" className={styles.card}>
      <h3 className={styles.cardTitle}>Mặt hàng trong đơn</h3>
      <div className={styles.itemsList}>
        {order.items.map((it, idx) => (
          <div key={idx} className={styles.itemRow}>
            <img src={it.image} alt={it.name} className={styles.itemImg} loading="lazy" decoding="async" />
            <div className={styles.itemInfo}>
              <strong>{it.name}</strong>
              <span>
                {formatCurrency(it.price)} x {it.quantity} hộp
              </span>
            </div>
            <div className={styles.itemTotal}>{formatCurrency(it.price * it.quantity)}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
