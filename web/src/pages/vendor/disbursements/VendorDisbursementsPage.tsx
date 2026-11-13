import styles from './VendorDisbursementsPage.module.css';
import { useState } from 'react';
import { routes } from '@/shared/config';
import { formatCurrency, formatDateTime } from '@/shared/utils';
import {
  Badge,
  Button,
  Card,
  Input,
  Select,
  Breadcrumbs,
  AsyncState,
  EmptyState,
  toast,
} from '@/shared/ui';
import { useAction } from '@/shared/lib';
import {
  DISBURSEMENT_PURPOSES,
  payoutPurposeLabel,
  useDisbursementRequests,
  type DisbursementPurpose,
} from '@/entities/payment';
import { orderCode } from '@/entities/order';
import { useCurrentUser } from '@/entities/user';
import { useRequestDisbursement } from '@/features/request-disbursement';

/**
 * FR-41: the escrow disbursements of the Shop.
 *
 * The money of every order comes from `GET /api/ledgers?vendorId=...`; the
 * request is `POST /api/ledgers/{orderId}/disbursements`.
 */
const STATUS: Record<string, { tone: 'gold' | 'green' | 'red'; label: string }> = {
  PENDING: { tone: 'gold', label: 'Chờ duyệt' },
  APPROVED: { tone: 'green', label: 'Đã duyệt' },
  REJECTED: { tone: 'red', label: 'Bị từ chối' },
};

export function VendorDisbursementsPage() {
  const user = useCurrentUser();
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [purpose, setPurpose] = useState<DisbursementPurpose>('MATERIALS');
  const { busy, run, error } = useAction();

  const asyncLedgers = useDisbursementRequests({ vendorId: user.vendorId });
  const requestDisbursement = useRequestDisbursement();

  const ledgers = asyncLedgers.kind === 'loaded' ? asyncLedgers.data.ledgers : [];
  const requests = asyncLedgers.kind === 'loaded' ? asyncLedgers.data.requests : [];
  // FR-47: only the deposit of a custom order not paid out yet can be advanced; the server refuses the rest.
  // Buy-now money is not asked for here: the admin pays it out once the complaint window closes.
  const depositLedgers = ledgers.filter(
    (l) => l.kind === 'CUSTOM_ORDER' && (l.held ?? 0) > 0 && (l.paidOut ?? 0) === 0,
  );
  const availableBalance = depositLedgers.reduce((acc, l) => acc + (l.held ?? 0), 0);
  const selectedHeld = depositLedgers.find((l) => l.orderId === orderId)?.held ?? 0;

  function handleRequestDisbursement(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId) {
      toast.error('Vui lòng chọn đơn hàng cần giải ngân.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > selectedHeld) {
      toast.error('Số tiền rút không hợp lệ!');
      return;
    }
    void run(async () => {
      const created = await requestDisbursement(orderId, {
        amount,
        purpose,
      });
      if (created) {
        toast.success(
          `Đã gửi yêu cầu giải ngân ${formatCurrency(amount)}. Ban quản trị sẽ duyệt lệnh trong 2-4 giờ.`,
        );
        setOrderId('');
        setAmount(0);
        asyncLedgers.reload();
      } else {
        toast.info('Yêu cầu giải ngân đã được ghi nhận. Vui lòng kiểm tra lại lịch sử.');
      }
    });
  }

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Kênh người bán', to: routes.vendor.overview },
          { label: 'Ví & Tài chính', to: routes.vendor.money },
          { label: 'Yêu cầu giải ngân' },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Giải ngân tiền cọc</h1>
          <p className={styles.subtitle}>
            Xin nhận trước một phần tiền cọc của đơn đặt hàng để mua nguyên liệu, in ấn; khi được
            duyệt, tiền vào Ví shop. Tiền của đơn đã hoàn tất tự vào Ví shop, không cần xin.
          </p>
        </div>
      </div>

      <div className={styles.gridTwo}>
        <Card padding="lg" className={styles.cardBody}>
          <h2 className={styles.sectionTitle}>Tạo yêu cầu giải ngân</h2>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Tiền cọc sàn đang giữ có thể xin giải ngân:</span>
            <div className={styles.statValue}>{formatCurrency(availableBalance)}</div>
          </div>

          <form onSubmit={handleRequestDisbursement} className={styles.cardBody}>
            <div>
              <Select
                label="Đơn đặt hàng cần giải ngân"
                required
                placeholder={
                  depositLedgers.length === 0
                    ? 'Chưa có đơn đặt hàng nào còn tiền cọc'
                    : '— Chọn đơn đặt hàng —'
                }
                options={depositLedgers.map((l) => ({
                  value: l.orderId,
                  label: `#${orderCode(l.orderId)} · còn giữ ${formatCurrency(l.held ?? 0)}`,
                }))}
                value={orderId}
                onChange={(v) => {
                  setOrderId(v);
                  setAmount(depositLedgers.find((l) => l.orderId === v)?.held ?? 0);
                }}
              />
            </div>

            <div>
              <label className={styles.label} htmlFor="vendor-disbursement-amount">
                Số tiền muốn giải ngân (VNĐ) *
              </label>
              <Input
                id="vendor-disbursement-amount"
                type="number"
                placeholder="Ví dụ: 500000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                max={selectedHeld}
                min={100000}
                required
              />
            </div>

            <div>
              <Select
                label="Mục đích sử dụng tiền"
                required
                options={DISBURSEMENT_PURPOSES.map((p) => ({ value: p, label: payoutPurposeLabel(p) }))}
                value={purpose}
                onChange={(v) => setPurpose(v as DisbursementPurpose)}
              />
            </div>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={busy}
              disabled={depositLedgers.length === 0}
              className={styles.fullWidthButton}
            >
              Gửi yêu cầu giải ngân
            </Button>
          </form>
        </Card>

        <Card padding="lg" className={styles.cardBody}>
          <h2 className={styles.sectionTitle}>Yêu cầu giải ngân đã gửi</h2>
          <AsyncState
            state={asyncLedgers}
            onRetry={asyncLedgers.reload}
            loadingMessage="Đang tải yêu cầu giải ngân..."
            isEmpty={() => requests.length === 0}
            empty={
              <EmptyState
                icon="wallet"
                title="Chưa gửi yêu cầu giải ngân nào"
                description="Tiền của đơn mua lẻ xem ở mục Đối soát tài khoản; ban quản trị chuyển khi hết hạn khiếu nại."
              />
            }
          >
            {() => (
              <div className={styles.stack}>
                {[...requests]
                  .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
                  .map((r) => (
                    <div key={r.requestId} className={styles.keyValueRow}>
                      <div>
                        <div className={styles.keyValueLabel}>
                          Đơn #{orderCode(r.ledger.orderId)} · {payoutPurposeLabel(r.purpose ?? '')}
                        </div>
                        <div className={styles.statLabel}>
                          {r.createdAt ? formatDateTime(r.createdAt) : ''}
                          {r.status === 'REJECTED' && r.reason ? ` · Lý do: ${r.reason}` : ''}
                        </div>
                      </div>
                      <div className={styles.rightText}>
                        <div className={styles.moneyText}>
                          {formatCurrency(r.approvedAmount ?? r.amount ?? 0)}
                        </div>
                        <Badge tone={STATUS[r.status ?? 'PENDING']?.tone ?? 'neutral'} size="sm">
                          {STATUS[r.status ?? 'PENDING']?.label ?? r.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </AsyncState>
        </Card>
      </div>
    </div>
  );
}
