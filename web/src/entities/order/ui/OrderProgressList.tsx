import { formatDateTime } from '@/shared/utils';
import { Card, Icon } from '@/shared/ui';
import type { Order } from '../model/types';
import { orderStatusLabel } from '../model/orderStatus';
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
 * các mốc gốc của đơn (fallback khi backend chưa có dữ liệu).
 */
export function OrderProgressList({ order, progressUpdates }: OrderProgressListProps) {
  // Đơn chỉ được tạo khi tiền đã về (mua ngay: thanh toán; đặt theo yêu cầu: cọc), nên mốc tạo đơn là bước đầu
  // tiên. Backend không ghi bước này vào lịch sử tiến độ, nên thêm ở đây để lịch trình đủ từ đầu tới cuối.
  const firstStep: ProgressUpdate = {
    milestone: order.type === 'BULK' ? 'DEPOSITED' : 'PAID',
    photoKeys: [],
    createdAt: order.createdAt,
  };
  const steps = progressUpdates.some((m) => m.milestone === firstStep.milestone)
    ? progressUpdates
    : [firstStep, ...progressUpdates];

  return (
    <Card padding="md" className={styles.card}>
      <h3 className={styles.cardTitle}>Lịch trình xử lý</h3>
      <div className={styles.stepperContainer}>
        {order.progressMilestones && progressUpdates.length === 0 ? (
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
          <div className={styles.milestoneList}>
            {steps.map((m, idx) => (
              <div
                key={`${m.milestone}-${idx}`}
                className={`${styles.milestoneItem} ${styles.completed}`}
              >
                <div className={styles.milestoneDot}>
                  <Icon name="check" size={12} />
                </div>
                <div className={styles.milestoneContent}>
                  <strong>{orderStatusLabel(m.milestone)}</strong>
                  {m.note && <span>{m.note}</span>}
                  {m.createdAt && <span>{formatDateTime(m.createdAt)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
