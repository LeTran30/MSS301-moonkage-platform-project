import styles from './AdminDisbursementsPage.module.css';
import { useState } from 'react';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Badge, Button, Card, Breadcrumbs, AsyncState, EmptyState, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import {
  payoutPurposeLabel,
  toPayoutRequest,
  useDisbursementRequests,
  type PayoutRequest,
} from '@/entities/payment';
import { useVendorSearch } from '@/entities/vendor';
import {
  DisbursementReviewModal,
  useApproveDisbursement,
  type ReviewDisbursementPayload,
} from '@/features/approve-disbursement';

/**
 * Q4.1 — approve the escrow disbursements the Shops asked for.
 *
 * `GET /api/ledgers` (admin: every ledger) then
 * `GET /api/ledgers/{orderId}/disbursements`; the decision is
 * `PATCH /api/ledgers/{orderId}/disbursements/{requestId}` (FR-47).
 */
export function AdminDisbursementsPage() {
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const { busy, run, error } = useAction();

  const asyncRequests = useDisbursementRequests();

  const asyncVendors = useVendorSearch();
  const vendorNames = new Map(
    (asyncVendors.kind === 'loaded' ? asyncVendors.data : []).map((v) => [
      v.id,
      v.businessName ?? v.id,
    ]),
  );

  const approveDisbursement = useApproveDisbursement();
  const requests: PayoutRequest[] =
    asyncRequests.kind === 'loaded'
      ? asyncRequests.data.requests.map((d) =>
          toPayoutRequest(d, vendorNames.get(d.ledger.vendorId ?? '') ?? ''),
        )
      : [];

  function handleReview(payload: ReviewDisbursementPayload) {
    if (!selectedRequest) return;
    void run(async () => {
      const reviewed = await approveDisbursement(
        selectedRequest.orderId,
        selectedRequest.requestId,
        payload,
      );
      if (reviewed) {
        toast.success(
          payload.status === 'REJECTED'
            ? `Đã từ chối yêu cầu ${selectedRequest.requestId}.`
            : `Đã duyệt yêu cầu ${selectedRequest.requestId} và cập nhật ledger của đơn.`,
        );
      } else {
        toast.info('Quyết định đã được ghi nhận. Vui lòng kiểm tra lại danh sách.');
      }
      setSelectedRequest(null);
      asyncRequests.reload();
    });
  }

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Quản Trị', to: routes.admin.overview },
          { label: 'Quản lý tài chính', to: routes.admin.money },
          { label: 'Duyệt giải ngân' },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Xét duyệt giải ngân tiền cọc</h1>
          <p className={styles.subtitle}>
            Duyệt toàn bộ, duyệt một phần hoặc từ chối yêu cầu của Shop
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
              description="Khi Shop gửi yêu cầu giải ngân tiền cọc, yêu cầu sẽ xuất hiện tại đây."
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
                  <th className={styles.tableHeaderCell}>Mục Đích</th>
                  <th className={styles.tableHeaderCell}>Cọc Còn Giữ</th>
                  <th className={styles.tableHeaderCell}>Đã Giải Ngân</th>
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
                    <td className={styles.tableCellMoney}>
                      {formatCurrency(r.approvedAmount ?? r.amount)}
                    </td>
                    <td className={styles.tableCell}>{payoutPurposeLabel(r.purpose)}</td>
                    <td className={styles.tableCellMoney}>
                      {formatCurrency(r.approvalCapacity)}
                    </td>
                    <td className={styles.tableCell}>{formatCurrency(r.disbursed)}</td>
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
                          onClick={() => setSelectedRequest(r)}
                        >
                          Xét duyệt
                        </Button>
                      ) : (
                        <span className={styles.mutedSmall}>
                          {r.status === 'REJECTED' ? r.reason || 'Đã từ chối' : 'Đã xử lý'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AsyncState>
      </Card>

      {selectedRequest && (
        <DisbursementReviewModal
          key={selectedRequest.requestId}
          open
          request={selectedRequest}
          vendorName={selectedRequest.vendorName}
          busy={busy}
          onClose={() => setSelectedRequest(null)}
          onSubmit={handleReview}
        />
      )}
    </div>
  );
}
