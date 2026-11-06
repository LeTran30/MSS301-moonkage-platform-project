import { formatCurrency } from '@/shared/utils';
import { Card, Icon } from '@/shared/ui';
import type { Order } from '../model/types';
import styles from './OrderItemsList.module.css';

interface OrderItemsListProps {
  order: Order;
}

/**
 * Danh sách mặt hàng trong đơn kèm tiền.
 *
 * Ảnh của dòng đơn đến từ danh mục sản phẩm. Khi máy chủ không có ảnh, màn
 * hình hiện một ô trung tính có chữ đầu của tên sản phẩm — không dùng ảnh mẫu.
 */
export function OrderItemsList({ order }: OrderItemsListProps) {
  return (
    <Card padding="md" className={styles.card}>
      <h3 className={styles.cardTitle}>Mặt hàng trong đơn</h3>
      <div className={styles.itemsList}>
        {order.items.map((it, idx) => (
          <div key={idx} className={styles.itemRow}>
            {it.image ? (
              <img
                src={it.image}
                alt={it.name}
                className={styles.itemImg}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className={styles.itemPlaceholder} aria-hidden="true">
                <Icon name="cake" size={22} />
              </span>
            )}
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
