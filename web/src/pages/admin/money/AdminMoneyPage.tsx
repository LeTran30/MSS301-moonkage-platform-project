import { useState } from 'react';
import { Card, Tabs, AsyncState, EmptyState, toast } from '@/shared/ui';
import { formatCurrency } from '@/shared/utils';
import { useAction } from '@/shared/lib';
import {
  EscrowCycleSummary,
  EscrowLockedTable,
  PayoutRequestCard,
  toPayoutRequest,
  useDisbursementRequests,
  type PayoutRequest,
} from '@/entities/payment';
import { useVendorSearch } from '@/entities/vendor';
import { useApproveDisbursement } from '@/features/approve-disbursement';
import { PayoutConfirmModal, usePayOut } from '@/features/pay-out';
import styles from './AdminMoneyPage.module.css';

type AdminMoneyTab = 'PAYOUTS' | 'ESCROW' | 'CYCLES';

/**
 * Q4.1 — the disbursements the Shop asked for.
 *
 * `GET /api/ledgers` (admin: every ledger) then
 * `GET /api/ledgers/{orderId}/disbursements` for the requests of each order.
 */
export function AdminMoneyPage() {
  const [activeTab, setActiveTab] = useState<AdminMoneyTab>('PAYOUTS');
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const { busy, run, error } = useAction();
  const approveDisbursement = useApproveDisbursement();
  const payOut = usePayOut();

  const asyncLedgers = useDisbursementRequests();

  const data = asyncLedgers.kind === 'loaded' ? asyncLedgers.data : { ledgers: [], requests: [] };
  const ledgers = data.ledgers;

  // Tên Shop: `GET /api/vendors` (admin: every vendor).
  const asyncVendors = useVendorSearch();
  const vendorNames = new Map(
    (asyncVendors.kind === 'loaded' ? asyncVendors.data : []).map((v) => [
      v.id,
      v.businessName ?? v.id,
    ]),
  );

  const requests: PayoutRequest[] = data.requests.map((d) =>
    toPayoutRequest(d, vendorNames.get(d.ledger.vendorId ?? '') ?? ''),
  );

  const totalHeld = ledgers.reduce((acc, l) => acc + (l.held ?? 0), 0);
  const totalLocked = ledgers
    .filter((l) => l.disputeOpen)
    .reduce((acc, l) => acc + (l.held ?? 0), 0);
  const pendingAmount = requests
    .filter((r) => r.status === 'PENDING')
    .reduce((acc, r) => acc + r.amount, 0);

  const handleOpenConfirm = (po: PayoutRequest) => {
    setSelectedPayout(po);
    setConfirmModalOpen(true);
  };

  /**
   * FR-47 + FR-48: the admin approves the request, then pays the vendor what
   * is held on the order (`PUT /api/ledgers/{orderId}/payout`).
   */
  const handleApprovePayout = () => {
    if (!selectedPayout) return;
    void run(async () => {
      const reviewed = await approveDisbursement(selectedPayout.orderId, selectedPayout.requestId, {
        status: 'APPROVED',
      });
      if (!reviewed) {
        toast.info('Yêu cầu giải ngân đã được ghi nhận. Vui lòng kiểm tra lại danh sách.');
        setConfirmModalOpen(false);
        asyncLedgers.reload();
        return;
      }
      await payOut(selectedPayout.orderId);
      toast.success(
        `Đã duyệt chi giải ngân ${formatCurrency(selectedPayout.amount)} cho ${
          vendorNames.get(selectedPayout.vendorId) ?? selectedPayout.vendorId
        }!`,
      );
      setConfirmModalOpen(false);
      asyncLedgers.reload();
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dòng tiền ký quỹ và giải ngân</h1>
          <p className={styles.desc}>
            Duyệt lệnh giải ngân tiền cọc, thực thi khóa tiền khi có khiếu nại và quản lý chu kỳ đối
            soát.
          </p>
        </div>
      </div>

      {error && (
        <div className={styles.alertSuccess} role="alert">
          {error}
        </div>
      )}

      {/* Escrow Mechanism Highlights */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <span className={styles.statLabel}>Tổng tiền ký quỹ của sàn</span>
          <strong className={styles.statVal}>{formatCurrency(totalHeld)}</strong>
          <span className={styles.statSub}>Được bảo chứng tại tài khoản trung gian</span>
        </Card>

        <Card className={styles.statCard}>
          <span className={styles.statLabel}>Lệnh giải ngân chờ kế toán duyệt</span>
          <strong className={`${styles.statVal} ${styles.goldText}`}>
            {formatCurrency(pendingAmount)}
          </strong>
          <span className={styles.statSub}>
            {requests.filter((r) => r.status === 'PENDING').length} lệnh đang chờ
          </span>
        </Card>

        <Card className={styles.statCard}>
          <span className={styles.statLabel}>Số tiền đóng băng do khiếu nại</span>
          <strong className={`${styles.statVal} ${styles.redText}`}>
            {formatCurrency(totalLocked)}
          </strong>
          <span className={styles.statSub}>Đang giữ cho đến khi giải quyết xong</span>
        </Card>
      </div>

      <Tabs<AdminMoneyTab>
        items={[
          { id: 'PAYOUTS', label: 'Lệnh duyệt giải ngân' },
          { id: 'ESCROW', label: 'Số dư đóng băng khiếu nại' },
          { id: 'CYCLES', label: 'Chu kỳ đối soát tuần' },
        ]}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'PAYOUTS' && (
        <AsyncState
          state={asyncLedgers}
          onRetry={asyncLedgers.reload}
          loadingMessage="Đang tải lệnh giải ngân..."
          isEmpty={() => requests.length === 0}
          empty={
            <EmptyState
              icon="wallet"
              title="Chưa có lệnh giải ngân nào"
              description="Khi Shop gửi yêu cầu rút tiền ký quỹ, lệnh sẽ hiện ở đây để duyệt."
            />
          }
        >
          {() => (
            <div className={styles.list}>
              {requests.map((po) => (
                <PayoutRequestCard
                  key={po.requestId}
                  request={po}
                  vendorName={vendorNames.get(po.vendorId) ?? po.vendorId}
                  onApprove={handleOpenConfirm}
                />
              ))}
            </div>
          )}
        </AsyncState>
      )}

      {activeTab === 'ESCROW' && <EscrowLockedTable ledgers={ledgers} vendorNames={vendorNames} />}

      {activeTab === 'CYCLES' && <EscrowCycleSummary ledgers={ledgers} />}

      {/* Modal Confirm Payout */}
      <PayoutConfirmModal
        open={confirmModalOpen}
        request={selectedPayout}
        vendorName={selectedPayout ? (vendorNames.get(selectedPayout.vendorId) ?? '') : ''}
        busy={busy}
        onClose={() => setConfirmModalOpen(false)}
        onSubmit={handleApprovePayout}
      />
    </div>
  );
}
