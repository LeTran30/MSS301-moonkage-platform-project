import { formatDateTime } from '@/shared/utils';
import { Badge, Card, Icon } from '@/shared/ui';
import type { Order } from '../model/types';
import type { ProgressUpdate } from '../api/orderDto';
import styles from './OrderProgressList.module.css';

interface OrderProgressListProps {
  order: Order;
  /** Lịch sử tiến độ từ backend (FR-21); rỗng thì dùng mốc gốc trong đơn. */
  progressUpdates: ProgressUpdate[];
}

/**
 * Lịch trình xử lý đơn hàng.
 *
 * Ưu tiên lịch sử tiến độ từ backend; khi backend chưa có dữ liệu thì hiển thị
 * các mốc gốc của đơn (fallback cho bản demo).
 */
export function OrderProgressList({ order, progressUpdates }: OrderProgressListProps) {
  return (
    <Card padding="md" className={styles.card}>
      <h3 className={styles.cardTitle}>Lịch trình xử lý</h3>
      <div className={styles.stepperContainer}>
        {progressUpdates.length > 0 ? (
          <div className={styles.milestoneList}>
            {progressUpdates.map((m, idx) => (
              <div
                key={`${m.milestone}-${idx}`}
                className={`${styles.milestoneItem} ${styles.completed}`}
              >
                <div className={styles.milestoneDot}>
                  <Icon name="check" size={12} />
                </div>
                <div className={styles.milestoneContent}>
                  <strong>{m.milestone}</strong>
                  {m.note && <span>{m.note}</span>}
                  {m.createdAt && <span>{formatDateTime(m.createdAt)}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : order.progressMilestones ? (
          <div className={styles.milestoneList}>
            {order.progressMilestones.map((m, idx) => (
              <div
                key={m.id}
                className={`${styles.milestoneItem} ${m.completed ? styles.completed : ''}`}
              >
                <div className={styles.milestoneDot}>
                  {m.completed ? <Icon name="check" size={12} /> : idx + 1}
                </div>
                <div className={styles.milestoneContent}>
                  <strong>{m.title}</strong>
                  {m.timestamp && <span>{formatDateTime(m.timestamp)}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.simpleStatus}>
            <Badge tone="green" size="md">
              {order.status}
            </Badge>
            <p>Bánh đã được giao thành công tới người nhận.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
