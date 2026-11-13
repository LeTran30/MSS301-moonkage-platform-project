import { useState } from 'react';
import { Button, Card, Tabs, AsyncState, EmptyState, toast } from '@/shared/ui';
import { formatCurrency } from '@/shared/utils';
import { useAction } from '@/shared/lib';
import {
  EscrowCycleSummary,
  EscrowLockedTable,
  PayoutRequestCard,
  toPayoutRequest,
  useDisbursementRequests,
  type PayoutRequest,
  type LedgerDto,
} from '@/entities/payment';
import { useVendorSearch } from '@/entities/vendor';
import {
  DisbursementReviewModal,
  useApproveDisbursement,
  type ReviewDisbursementPayload,
} from '@/features/approve-disbursement';
import { PayoutConfirmModal, usePayOut } from '@/features/pay-out';
import styles from './AdminMoneyPage.module.css';

type AdminMoneyTab = 'DISBURSEMENTS' | 'FINAL_PAYOUTS' | 'ESCROW' | 'CYCLES';

/**
 * Q4.1 — the disbursements the Shop asked for.
 *
 * `GET /api/ledgers` (admin: every ledger) then
 * `GET /api/ledgers/{orderId}/disbursements` for the requests of each order.
 */
export function AdminMoneyPage() {
  const [activeTab, setActiveTab] = useState<AdminMoneyTab>('DISBURSEMENTS');
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState<LedgerDto | null>(null);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
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
  const payableLedgers = ledgers.filter((ledger) => ledger.payable && (ledger.held ?? 0) > 0);

  const handleOpenConfirm = (po: PayoutRequest) => {
    setSelectedPayout(po);
    setConfirmModalOpen(true);
  };

  /**
   * FR-47: approving an early deposit disbursement only moves the approved
   * amount from held to disbursed. Final-order payout is a separate FR-48
   * action and must never be triggered from this request.
   */
  const handleReviewDisbursement = (payload: ReviewDisbursementPayload) => {
    if (!selectedPayout) return;
    void run(async () => {
      const reviewed = await approveDisbursement(
        selectedPayout.orderId,
        selectedPayout.requestId,
        payload,
      );
      if (!reviewed) {
        toast.info('Yêu cầu giải ngân đã được ghi nhận. Vui lòng kiểm tra lại danh sách.');
        setConfirmModalOpen(false);
        asyncLedgers.reload();
        return;
      }
      const vendorName = vendorNames.get(selectedPayout.vendorId) ?? selectedPayout.vendorId;
      if (payload.status === 'REJECTED') {
        toast.success(`Đã từ chối yêu cầu giải ngân của ${vendorName}.`);
      } else {
        const approvedAmount = payload.approvedAmount ?? selectedPayout.amount;
        toast.success(
          `Đã duyệt và ghi sổ giải ngân ${formatCurrency(approvedAmount)} cho ${vendorName}!`,
        );
      }
      setConfirmModalOpen(false);
      asyncLedgers.reload();
    });
  };

  const handleFinalPayout = () => {
    if (!selectedLedger) return;
    void run(async () => {
      const payout = await payOut(selectedLedger.orderId);
      if (!payout) {
        toast.info('Payout đã được ghi nhận. Vui lòng tải lại danh sách để kiểm tra.');
      } else {
        toast.success(
          `Đã payout ${formatCurrency(payout.amount ?? selectedLedger.held ?? 0)} cho ${
            vendorNames.get(selectedLedger.vendorId ?? '') ?? selectedLedger.vendorId ?? 'Shop'
          }!`,
        );
      }
      setPayoutModalOpen(false);
      setSelectedLedger(null);
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
          { id: 'DISBURSEMENTS', label: 'Lệnh duyệt giải ngân' },
          { id: 'FINAL_PAYOUTS', label: `Payout cuối đơn (${payableLedgers.length})` },
          { id: 'ESCROW', label: 'Số dư đóng băng khiếu nại' },
          { id: 'CYCLES', label: 'Chu kỳ đối soát tuần' },
        ]}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'DISBURSEMENTS' && (
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

      {activeTab === 'FINAL_PAYOUTS' && (
        <AsyncState
          state={asyncLedgers}
          onRetry={asyncLedgers.reload}
          loadingMessage="Đang tải đơn đủ điều kiện payout..."
          isEmpty={() => payableLedgers.length === 0}
          empty={
            <EmptyState
              icon="wallet"
              title="Chưa có đơn đủ điều kiện payout"
              description="Đơn sẽ xuất hiện khi đã hoàn tất thời hạn khiếu nại và không còn giao dịch chờ xử lý."
            />
          }
        >
          {() => (
            <div className={styles.list}>
              {payableLedgers.map((ledger) => (
                <Card key={ledger.orderId} className={styles.payoutCard}>
                  <div>
                    <strong>Đơn {ledger.orderId}</strong>
                    <p className={styles.statSub}>
                      {vendorNames.get(ledger.vendorId ?? '') ?? ledger.vendorId ?? 'Shop'} · Còn giữ{' '}
                      {formatCurrency(ledger.held ?? 0)}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSelectedLedger(ledger);
                      setPayoutModalOpen(true);
                    }}
                  >
                    Payout phần còn lại
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </AsyncState>
      )}

      {activeTab === 'ESCROW' && <EscrowLockedTable ledgers={ledgers} vendorNames={vendorNames} />}

      {activeTab === 'CYCLES' && <EscrowCycleSummary ledgers={ledgers} />}

      {/* FR-47 review: separate from the final-order payout. */}
      {confirmModalOpen && selectedPayout && (
        <DisbursementReviewModal
          key={selectedPayout.requestId}
          open
          request={selectedPayout}
          vendorName={vendorNames.get(selectedPayout.vendorId) ?? ''}
          busy={busy}
          onClose={() => setConfirmModalOpen(false)}
          onSubmit={handleReviewDisbursement}
        />
      )}


      {payoutModalOpen && selectedLedger && (
        <PayoutConfirmModal
          open
          ledger={selectedLedger}
          vendorName={vendorNames.get(selectedLedger.vendorId ?? '') ?? ''}
          busy={busy}
          onClose={() => setPayoutModalOpen(false)}
          onSubmit={handleFinalPayout}
        />
      )}
    </div>
  );
}
