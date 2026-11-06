import styles from './AdminDisbursementsPage.module.css';
import { useState } from 'react';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Badge, Button, Card, Breadcrumbs, AsyncState, EmptyState, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useDisbursementRequests } from '@/entities/payment';
import { useVendorSearch } from '@/entities/vendor';
import { useApproveDisbursement } from '@/features/approve-disbursement';

type DisbursementRow = {
  requestId: string;
  orderId: string;
  vendorId: string;
  amount: number;
  purpose: string;
  status: string;
  createdAt?: string;
  reason?: string | null;
};

/**
 * Q4.1 — approve the escrow disbursements the Shops asked for.
 *
 * `GET /api/ledgers` (admin: every ledger) then
 * `GET /api/ledgers/{orderId}/disbursements`; the decision is
 * `PATCH /api/ledgers/{orderId}/disbursements/{requestId}` (FR-47).
 */
export function AdminDisbursementsPage() {
  const [busyId, setBusyId] = useState<string | null>(null);
  const { run, error } = useAction();

  const asyncRequests = useDisbursementRequests();

  const asyncVendors = useVendorSearch();
  const vendorNames = new Map(
    (asyncVendors.kind === 'loaded' ? asyncVendors.data : []).map((v) => [
      v.id,
      v.businessName ?? v.id,
    ]),
  );

  const approveDisbursement = useApproveDisbursement();
  const requests: DisbursementRow[] =
    asyncRequests.kind === 'loaded'
      ? asyncRequests.data.requests.map((d) => ({
          requestId: d.requestId,
          orderId: d.orderId ?? d.ledger.orderId,
          vendorId: d.ledger.vendorId ?? '',
          amount: d.amount ?? 0,
          purpose: d.purpose ?? 'MATERIALS',
          status: d.status ?? 'PENDING',
          createdAt: d.createdAt,
          reason: d.reason,
        }))
      : [];

  async function handleApprove(row: DisbursementRow) {
    setBusyId(row.requestId);
    await run(async () => {
      const reviewed = await approveDisbursement(row.orderId, row.requestId, {
        status: 'APPROVED',
      });
      if (reviewed) {
        toast.success(
          `Đã phê duyệt lệnh giải ngân ${row.requestId}! Hệ thống đã lập ủy nhiệm chi VietQR.`,
        );
      } else {
        toast.info('Lệnh giải ngân đã được ghi nhận. Vui lòng kiểm tra lại danh sách.');
      }
      asyncRequests.reload();
    });
    setBusyId(null);
  }

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Quản Trị', to: routes.admin.overview },
          { label: 'Quản lý tài chính', to: routes.admin.money },
          { label: 'Phê duyệt giải ngân Escrow' },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Phê Duyệt Lệnh Giải Ngân Ký Quỹ Escrow</h1>
          <p className={styles.subtitle}>
            Kiểm soát các lệnh rút tiền từ xưởng bánh sau khi đơn hàng được đối soát hợp lệ
          </p>
        </div>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <Card padding="none" className={styles.tableWrap}>
        <AsyncState
          state={asyncRequests}
          onRetry={asyncRequests.reload}
          loadingMessage="Đang tải lệnh giải ngân..."
          isEmpty={() => requests.length === 0}
          empty={
            <EmptyState
              icon="wallet"
              title="Chưa có lệnh giải ngân nào"
              description="Khi Shop gửi yêu cầu rút tiền, lệnh sẽ hiện ở đây để Admin phê duyệt."
            />
          }
        >
          {() => (
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHead}>
                  <th className={styles.tableHeaderCell}>Mã Lệnh</th>
                  <th className={styles.tableHeaderCell}>Xưởng Thụ Hưởng</th>
                  <th className={styles.tableHeaderCell}>Số Tiền Giải Ngân</th>
                  <th className={styles.tableHeaderCell}>Đơn Hàng</th>
                  <th className={styles.tableHeaderCell}>Ngày Tạo</th>
                  <th className={styles.tableHeaderCell}>Trạng Thái</th>
                  <th className={styles.tableHeaderCell}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.requestId} className={styles.tableRow}>
                    <td className={styles.tableCellStrong}>{r.requestId}</td>
                    <td className={styles.tableCell}>
                      {vendorNames.get(r.vendorId) ?? r.vendorId ?? '—'}
                    </td>
                    <td className={styles.tableCellMoney}>{formatCurrency(r.amount)}</td>
                    <td className={styles.tableCellMuted}>#{r.orderId}</td>
                    <td className={styles.tableCell}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className={styles.tableCell}>
                      <Badge
                        tone={
                          r.status === 'APPROVED'
                            ? 'green'
                            : r.status === 'REJECTED'
                              ? 'red'
                              : 'amber'
                        }
                      >
                        {r.status === 'APPROVED'
                          ? 'Đã duyệt'
                          : r.status === 'REJECTED'
                            ? 'Đã bác'
                            : 'Chờ duyệt'}
                      </Badge>
                    </td>
                    <td className={styles.tableCell}>
                      {r.status === 'PENDING' ? (
                        <Button
                          size="sm"
                          variant="primary"
                          loading={busyId === r.requestId}
                          onClick={() => void handleApprove(r)}
                        >
                          Duyệt Chi
                        </Button>
                      ) : (
                        <span className={styles.mutedSmall}>Đã ủy nhiệm</span>
                      )}
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
