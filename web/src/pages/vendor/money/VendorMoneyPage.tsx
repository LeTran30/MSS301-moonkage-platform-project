import { useState } from 'react';
import { Card, Button, Tabs, AsyncState, EmptyState, Icon, toast } from '@/shared/ui';
import { formatCurrency } from '@/shared/utils';
import { useAction } from '@/shared/lib';
import { useLedgerList, VendorLedgerTable, type DisbursementPurpose } from '@/entities/payment';
import { useCurrentUser } from '@/entities/user';
import { useRequestDisbursement, DisbursementRequestModal } from '@/features/request-disbursement';
import styles from './VendorMoneyPage.module.css';

type MoneyTab = 'ALL' | 'RETAIL' | 'BULK' | 'LOCKED';

/**
 * FR-43: the money of every order of the Shop, read from
 * `GET /api/ledgers?vendorId=...` of payment-service.
 */
export function VendorMoneyPage() {
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState<MoneyTab>('ALL');
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawOrderId, setWithdrawOrderId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPurpose, setWithdrawPurpose] = useState<DisbursementPurpose>('MATERIALS');
  const { busy, run, error } = useAction();

  const asyncLedgers = useLedgerList({ vendorId: user.vendorId });
  const requestDisbursement = useRequestDisbursement();

  const ledgers = asyncLedgers.kind === 'loaded' ? asyncLedgers.data : [];

  const totalAvailable = ledgers.reduce((acc, l) => acc + (l.remainingDisbursable ?? 0), 0);
  const totalLocked = ledgers
    .filter((l) => l.disputeOpen)
    .reduce((acc, l) => acc + (l.held ?? 0), 0);
  const totalDisbursed = ledgers.reduce((acc, l) => acc + (l.disbursed ?? 0), 0);

  const filteredItems = ledgers.filter((l) => {
    if (activeTab === 'RETAIL') return l.kind === 'BUY_NOW';
    if (activeTab === 'BULK') return l.kind === 'CUSTOM_ORDER';
    if (activeTab === 'LOCKED') return Boolean(l.disputeOpen);
    return true;
  });

  const eligibleLedgers = ledgers.filter((l) => l.disbursementEligible);
  const selectedLedger = eligibleLedgers.find((l) => l.orderId === withdrawOrderId);
  const selectedAvailable = selectedLedger?.remainingDisbursable ?? 0;

  const openWithdraw = (orderId?: string, amount?: number) => {
    const next = eligibleLedgers.find((l) => l.orderId === orderId) ?? eligibleLedgers[0];
    setWithdrawOrderId(next?.orderId ?? '');
    setWithdrawAmount(String(amount ?? next?.remainingDisbursable ?? 0));
    setWithdrawModalOpen(true);
  };

  /**
   * FR-41: the vendor owner asks the platform to release what is held on one
   * order. `POST /api/ledgers/{orderId}/disbursements`.
   */
  const handleWithdraw = () => {
    const amount = Number(withdrawAmount);
    if (!withdrawOrderId) {
      toast.error('Vui lòng chọn đơn hàng cần giải ngân.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > selectedAvailable) {
      toast.error('Số tiền giải ngân không hợp lệ.');
      return;
    }
    void run(async () => {
      const created = await requestDisbursement(withdrawOrderId, {
        amount,
        purpose: withdrawPurpose,
      });
      setWithdrawModalOpen(false);
      if (created) {
        toast.success(
          `Đã gửi yêu cầu giải ngân ${formatCurrency(amount)} cho đơn #${withdrawOrderId}. Ban quản trị sẽ duyệt.`,
        );
      } else {
        toast.info('Yêu cầu giải ngân đã được ghi nhận. Vui lòng kiểm tra trang lịch sử giải ngân.');
      }
      asyncLedgers.reload();
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Đối soát &amp; Dòng tiền</h1>
          <p className={styles.desc}>
            Theo dõi doanh thu bán lẻ, nhận giải ngân tiền cọc theo tiến độ và quản lý số dư ký quỹ.
          </p>
        </div>
        <Button
          variant="primary"
          iconLeft="wallet"
          disabled={eligibleLedgers.length === 0}
          onClick={() => openWithdraw()}
        >
          Yêu cầu giải ngân tiền cọc
        </Button>
      </div>

      {/* Thống kê dòng tiền */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <span className={styles.statLabel}>Tiền cọc còn có thể yêu cầu</span>
          <strong className={`${styles.statValue} ${styles.green}`}>
            {formatCurrency(totalAvailable)}
          </strong>
          <span className={styles.statSub}>Không tính phí sàn — Moonkage không thu hoa hồng</span>
        </Card>

        <Card className={styles.statCard}>
          <span className={styles.statLabel}>Đang tạm khóa khiếu nại</span>
          <strong className={`${styles.statValue} ${styles.red}`}>
            {formatCurrency(totalLocked)}
          </strong>
          <span className={styles.statSub}>Tiền bị giữ cho tới khi quyết định khiếu nại</span>
        </Card>

        <Card className={styles.statCard}>
          <span className={styles.statLabel}>Tiền cọc đã giải ngân</span>
          <strong className={styles.statValue}>{formatCurrency(totalDisbursed)}</strong>
          <span className={styles.statSub}>Theo dõi trạng thái chi trả của kế toán sàn</span>
        </Card>
      </div>

      <div className={styles.escrowNotice}>
        <Icon name="shield" size={18} />{' '}
        <strong>Cơ chế ký quỹ bảo vệ người bán &amp; người mua:</strong> Tiền thanh toán của người
        mua được Moonkage ghi nhận trong ledger. Với đơn đặt hàng, Shop có thể xin giải ngân một
        phần tiền cọc; phần tiền còn lại chỉ được payout sau khi giao hàng và đơn hết điều kiện khiếu
        nại.
      </div>

      <Tabs<MoneyTab>
        items={[
          { id: 'ALL', label: 'Tất cả khoản thu' },
          { id: 'RETAIL', label: 'Bán lẻ' },
          { id: 'BULK', label: 'Giải ngân cọc sản xuất' },
          { id: 'LOCKED', label: 'Đang khóa khiếu nại' },
        ]}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      <Card className={styles.tableCard}>
        <AsyncState
          state={asyncLedgers}
          onRetry={asyncLedgers.reload}
          loadingMessage="Đang tải sổ ký quỹ từ Moonkage..."
          isEmpty={() => filteredItems.length === 0}
          empty={
            <EmptyState
              icon="wallet"
              title="Chưa có khoản thu nào"
              description="Sổ ký quỹ sẽ hiện ở đây ngay khi Shop nhận đơn hàng đầu tiên."
            />
          }
        >
          {() => <VendorLedgerTable ledgers={filteredItems} />}
        </AsyncState>
      </Card>

      <DisbursementRequestModal
        open={withdrawModalOpen}
        eligibleLedgers={eligibleLedgers}
        selectedAvailable={selectedAvailable}
        orderId={withdrawOrderId}
        amount={withdrawAmount}
        purpose={withdrawPurpose}
        error={error}
        busy={busy}
        onOrderIdChange={(id, nextAmount) => {
          setWithdrawOrderId(id);
          setWithdrawAmount(nextAmount);
        }}
        onAmountChange={setWithdrawAmount}
        onPurposeChange={setWithdrawPurpose}
        onClose={() => setWithdrawModalOpen(false)}
        onSubmit={handleWithdraw}
      />
    </div>
  );
}
