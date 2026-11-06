import styles from './VendorReconciliationPage.module.css';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Badge, Button, Card, Breadcrumbs, AsyncState, EmptyState, toast } from '@/shared/ui';
import { useLedgerList } from '@/entities/payment';
import { useCurrentUser } from '@/entities/user';

/**
 * FR-43: the reconciliation of the Shop, grouped by the expected payout
 * period of every ledger (`GET /api/ledgers?vendorId=...`).
 *
 * The backend charges no commission (BR-10), so the fee column shows what the
 * platform already refunded instead of an invented percentage.
 */
export function VendorReconciliationPage() {
  const user = useCurrentUser();

  const asyncLedgers = useLedgerList({ vendorId: user.vendorId });

  const ledgers = asyncLedgers.kind === 'loaded' ? asyncLedgers.data : [];

  // Nhóm theo kỳ dự kiến chi trả (tháng/năm của `expectedPayoutDate`).
  const periods = ledgers.reduce<Record<string, typeof ledgers>>((acc, l) => {
    const key = l.expectedPayoutDate ? l.expectedPayoutDate.slice(0, 7) : 'CHUA_XAC_DINH';
    (acc[key] ||= []).push(l);
    return acc;
  }, {});

  const records = Object.entries(periods)
    .map(([period, group]) => {
      const totalOrders = group.length;
      const gmv = group.reduce((acc, l) => acc + (l.totalCollected ?? 0), 0);
      const refunded = group.reduce((acc, l) => acc + (l.refunded ?? 0), 0);
      const net = group.reduce((acc, l) => acc + (l.toReceive ?? 0), 0);
      const allPaid = group.every((l) => l.paidOut);
      return {
        period,
        totalOrders,
        gmv,
        fee: refunded,
        net,
        status: allPaid ? 'Đã thanh toán' : 'Đang trong kỳ',
      };
    })
    .sort((a, b) => b.period.localeCompare(a.period));

  const periodLabel = (period: string) =>
    period === 'CHUA_XAC_DINH' ? 'Chưa xác định kỳ chi' : `Kỳ ${period.replace('-', '/')}`;

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Kênh Xưởng', to: routes.vendor.overview },
          { label: 'Ví & Tài chính', to: routes.vendor.money },
          { label: 'Lịch sử đối soát' },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Lịch Sử Đối Soát Doanh Thu</h1>
          <p className={styles.subtitle}>
            Đối soát tự động mỗi 15 ngày — Minh bạch số tiền giữ ký quỹ và số tiền đã hoàn trả
          </p>
        </div>
        <Button
          variant="outline"
          iconLeft="download"
          onClick={() => toast.info('Đang xuất file Excel sao kê...')}
        >
          Xuất Báo Cáo Excel
        </Button>
      </div>

      <Card padding="none" className={styles.tableWrap}>
        <AsyncState
          state={asyncLedgers}
          onRetry={asyncLedgers.reload}
          loadingMessage="Đang tải lịch sử đối soát..."
          isEmpty={() => records.length === 0}
          empty={
            <EmptyState
              icon="receipt"
              title="Chưa có kỳ đối soát nào"
              description="Khi Shop có đơn hàng hoàn tất, từng kỳ đối soát sẽ hiện ở đây."
            />
          }
        >
          {() => (
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHead}>
                  <th className={styles.tableHeaderCell}>Kỳ Đối Soát</th>
                  <th className={styles.tableHeaderCell}>Số Đơn Hoàn Tất</th>
                  <th className={styles.tableHeaderCell}>Doanh Thu (GMV)</th>
                  <th className={styles.tableHeaderCell}>Đã Hoàn Trả</th>
                  <th className={styles.tableHeaderCell}>Thực Nhận</th>
                  <th className={styles.tableHeaderCell}>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.period} className={styles.tableRow}>
                    <td className={styles.tableCellStrong}>{periodLabel(r.period)}</td>
                    <td className={styles.tableCell}>{r.totalOrders} đơn</td>
                    <td className={styles.tableCell}>{formatCurrency(r.gmv)}</td>
                    <td className={styles.tableCellMuted}>-{formatCurrency(r.fee)}</td>
                    <td className={styles.tableCellMoney}>{formatCurrency(r.net)}</td>
                    <td className={styles.tableCell}>
                      <Badge tone={r.status === 'Đã thanh toán' ? 'green' : 'amber'}>
                        {r.status}
                      </Badge>
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
