import { formatCurrency } from '@/shared/utils';
import { Badge, Card, CardHeader, EmptyState } from '@/shared/ui';
import type { LedgerDto } from '../api/ledgerApi';
import styles from './EscrowLedgerViews.module.css';

interface EscrowLockedTableProps {
  /** Các sổ quỹ có khiếu nại đang mở (Q4.2). */
  ledgers: LedgerDto[];
  /** Tên Shop theo `vendorId`. */
  vendorNames: Map<string, string>;
}

/** Sổ theo dõi tiền bị khóa do khiếu nại (Q4.2, FR-49). */
export function EscrowLockedTable({ ledgers, vendorNames }: EscrowLockedTableProps) {
  const locked = ledgers.filter((l) => l.disputeOpen);
  return (
    <Card className={styles.escrowDetailCard}>
      <CardHeader
        title="Sổ theo dõi tiền bị khóa do khiếu nại"
        description="Quy tắc: Số tiền tối đa có thể hoàn không vượt quá số tiền Moonkage đang giữ"
      />
      <div className={styles.escrowTableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Đơn hàng</th>
              <th>Shop</th>
              <th>Số tiền bị khóa</th>
              <th>Trạng thái quỹ</th>
            </tr>
          </thead>
          <tbody>
            {locked.map((l) => (
              <tr key={l.orderId}>
                <td>
                  <strong>#{l.orderId}</strong>
                </td>
                <td>{vendorNames.get(l.vendorId ?? '') ?? l.vendorId ?? '—'}</td>
                <td>
                  <strong className={styles.redText}>{formatCurrency(l.held ?? 0)}</strong>
                </td>
                <td>
                  <Badge tone="red">Đang khóa Escrow</Badge>
                </td>
              </tr>
            ))}
            {locked.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <EmptyState
                    icon="shield"
                    title="Không có đơn nào bị khóa"
                    description="Toàn bộ tiền ký quỹ hiện đang được giải ngân bình thường."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

interface EscrowCycleSummaryProps {
  ledgers: LedgerDto[];
}

/** Lịch đối soát tự động (Q4.3). */
export function EscrowCycleSummary({ ledgers }: EscrowCycleSummaryProps) {
  const waiting = ledgers.filter((l) => l.payable).reduce((acc, l) => acc + (l.toReceive ?? 0), 0);
  const paid = ledgers.reduce((acc, l) => acc + (l.paidOut ?? 0), 0);
  return (
    <Card className={styles.escrowDetailCard}>
      <CardHeader
        title="Lịch đối soát tự động"
        description="Chu kỳ đối soát định kỳ. Moonkage không thu hoa hồng — số tiền Shop nhận là toàn bộ số tiền giữ."
      />
      <div className={styles.cycleInfo}>
        <p>
          <strong>Tổng số kỳ đang mở:</strong> {ledgers.length} đơn hàng
        </p>
        <p>
          <strong>Tổng tiền chờ chi:</strong> {formatCurrency(waiting)}
        </p>
        <p>
          <strong>Đã chi trả:</strong> {formatCurrency(paid)}
        </p>
      </div>
    </Card>
  );
}
