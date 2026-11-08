import { Card } from '@/shared/ui';
import type { Order } from '../model/types';
import styles from './OrderDeliveryInfo.module.css';

interface OrderDeliveryInfoProps {
  order: Order;
}

/** Nơi bánh được giao tới, kèm mã vận đơn khi Shop đã gửi hàng liên tỉnh. */
export function OrderDeliveryInfo({ order }: OrderDeliveryInfoProps) {
  const { receiver, phone, address, province } = order.shippingAddress;
  return (
    <Card padding="md" className={styles.card}>
      <h3 className={styles.cardTitle}>Giao tới</h3>
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt>Người nhận</dt>
          <dd>
            {receiver}
            {phone && ` · ${phone}`}
          </dd>
        </div>
        <div className={styles.row}>
          <dt>Địa chỉ</dt>
          <dd>{[address, province].filter(Boolean).join(', ')}</dd>
        </div>
        {order.trackingCode && (
          <div className={styles.row}>
            <dt>Mã vận đơn</dt>
            <dd>{order.trackingCode}</dd>
          </div>
        )}
      </dl>
    </Card>
  );
}
