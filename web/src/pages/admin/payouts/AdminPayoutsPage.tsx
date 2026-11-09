import styles from './AdminPayoutsPage.module.css';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Badge, Button, Card, Breadcrumbs, AsyncState, EmptyState, toast } from '@/shared/ui';
import { useDisbursementRequests } from '@/entities/payment';
import { useVendorSearch } from '@/entities/vendor';

/**
 * Q4.2 — the money the platform already moved to the Shops.
 *
 * `GET /api/ledgers` (admin: every ledger) then
 * `GET /api/ledgers/{orderId}/disbursements` for the requests of each order.
 */
export function AdminPayoutsPage() {
  const asyncPayouts = useDisbursementRequests();

  const asyncVendors = useVendorSearch();
  const vendorNames = new Map(
    (asyncVendors.kind === 'loaded' ? asyncVendors.data : []).map((v) => [
      v.id,
      v.businessName ?? v.id,
    ]),
  );

  const payouts =
    asyncPayouts.kind === 'loaded'
      ? asyncPayouts.data.requests
          .filter((d) => d.status === 'APPROVED' || d.status === 'PAID' || d.status === 'DISBURSED')
          .map((d) => ({
            txId: d.requestId,
            orderId: d.orderId ?? d.ledger.orderId,
            vendorId: d.ledger.vendorId ?? '',
            recipient: d.ledger.vendorId ?? '',
            amount: d.approvedAmount ?? d.amount ?? 0,
            decidedAt: d.decidedAt ?? d.createdAt ?? '',
            status: d.status ?? '',
          }))
      : [];

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Quản Trị', to: routes.admin.overview },
          { label: 'Quản lý tài chính', to: routes.admin.money },
          { label: 'Lịch sử chuyển tiền' },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Lịch sử chuyển tiền và ủy nhiệm chi</h1>
          <p className={styles.subtitle}>
            Nhật ký giao dịch chuyển tiền tự động từ tài khoản ký quỹ sang tài khoản ngân hàng của
            xưởng
          </p>
        </div>
        <Button
          variant="outline"
          iconLeft="download"
          onClick={() => toast.info('Đang tải sao kê ngân hàng...')}
        >
          Tải Sao Kê
        </Button>
      </div>

      <Card padding="none" className={styles.tableWrap}>
        <AsyncState
          state={asyncPayouts}
          onRetry={asyncPayouts.reload}
          loadingMessage="Đang tải lịch sử chuyển tiền..."
          isEmpty={() => payouts.length === 0}
          empty={
            <EmptyState
              icon="receipt"
              title="Chưa có giao dịch chuyển tiền nào"
              description="Các lệnh đã được duyệt và chi trả sẽ hiện ở đây."
            />
          }
        >
          {() => (
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHead}>
                  <th className={styles.tableHeaderCell}>Mã GD</th>
                  <th className={styles.tableHeaderCell}>Người Thụ Hưởng</th>
                  <th className={styles.tableHeaderCell}>Đơn Hàng</th>
                  <th className={styles.tableHeaderCell}>Số Tiền</th>
                  <th className={styles.tableHeaderCell}>Thời Gian</th>
                  <th className={styles.tableHeaderCell}>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.txId} className={styles.tableRow}>
                    <td className={styles.tableCellStrong}>{p.txId}</td>
                    <td className={styles.tableCell}>
                      {vendorNames.get(p.vendorId) ?? p.recipient ?? '—'}
                    </td>
                    <td className={styles.tableCellMono}>#{p.orderId}</td>
                    <td className={styles.tableCellMoney}>{formatCurrency(p.amount)}</td>
                    <td className={styles.tableCellMuted}>
                      {p.decidedAt ? new Date(p.decidedAt).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className={styles.tableCell}>
                      <Badge tone="green">Thành công</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AsyncState>
      </Card>
    </div>
  );
}
