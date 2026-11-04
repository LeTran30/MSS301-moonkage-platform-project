import { formatCurrency } from '@/shared/utils';
import { Badge } from '@/shared/ui';
import type { LedgerDto } from '../api/ledgerApi';
import styles from './VendorLedgerTable.module.css';

interface VendorLedgerTableProps {
  /** Các dòng sổ quỹ đã lọc theo tab đang chọn. */
  ledgers: LedgerDto[];
}

/**
 * B5.1 / B5.2: bảng dòng tiền của Shop — mỗi đơn hàng một dòng, kèm trạng
 * thái giải ngân (FR-41, FR-43).
 */
export function VendorLedgerTable({ ledgers }: VendorLedgerTableProps) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Phân loại</th>
            <th>Tổng thu</th>
            <th>Đang giữ</th>
            <th>Thực nhận</th>
            <th>Trạng thái</th>
            <th>Ngày dự kiến chi</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {ledgers.map((l) => (
            <tr key={l.orderId}>
              <td>
                <strong>#{l.orderId}</strong>
              </td>
              <td>
                {l.kind === 'CUSTOM_ORDER' ? (
                  <Badge tone="gold">Giải ngân cọc</Badge>
                ) : (
                  <Badge tone="neutral">Đơn bán lẻ</Badge>
                )}
              </td>
              <td>{formatCurrency(l.totalCollected ?? 0)}</td>
              <td>{formatCurrency(l.held ?? 0)}</td>
              <td className={styles.payout}>
                <strong>{formatCurrency(l.toReceive ?? 0)}</strong>
              </td>
              <td>
                {l.disputeOpen ? (
                  <Badge tone="red">Khóa khiếu nại</Badge>
                ) : l.paidOut ? (
                  <Badge tone="green">Đã giải ngân</Badge>
                ) : l.payable ? (
                  <Badge tone="blue">Chờ chuyển</Badge>
                ) : (
                  <Badge tone="neutral">Chờ kỳ đối soát</Badge>
                )}
              </td>
              <td className={styles.date}>{l.expectedPayoutDate || '—'}</td>
              <td className={styles.note}>
                {l.disputeOpen
                  ? 'Tạm khóa do khách gửi khiếu nại (FR-49)'
                  : l.payable
                    ? 'Đủ điều kiện giải ngân — gửi yêu cầu rút tiền'
                    : 'Chờ người mua xác nhận nhận hàng'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
