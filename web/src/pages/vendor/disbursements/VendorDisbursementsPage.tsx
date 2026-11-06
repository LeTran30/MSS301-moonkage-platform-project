import styles from './VendorDisbursementsPage.module.css';
import { useState } from 'react';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
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
  useLedgerList,
  type DisbursementPurpose,
} from '@/entities/payment';
import { useCurrentUser } from '@/entities/user';
import { useRequestDisbursement } from '@/features/request-disbursement';

/**
 * FR-41: the escrow disbursements of the Shop.
 *
 * The money of every order comes from `GET /api/ledgers?vendorId=...`; the
 * request is `POST /api/ledgers/{orderId}/disbursements`.
 */
export function VendorDisbursementsPage() {
  const user = useCurrentUser();
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [purpose, setPurpose] = useState<DisbursementPurpose>('MATERIALS');
  const { busy, run, error } = useAction();

  const asyncLedgers = useLedgerList({ vendorId: user.vendorId });
  const requestDisbursement = useRequestDisbursement();

  const ledgers = asyncLedgers.kind === 'loaded' ? asyncLedgers.data : [];
  const payableLedgers = ledgers.filter((l) => l.payable);
  const availableBalance = ledgers.reduce((acc, l) => acc + (l.toReceive ?? 0), 0);

  function handleRequestDisbursement(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId) {
      toast.error('Vui lòng chọn đơn hàng cần giải ngân.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > availableBalance) {
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
          `Đã tạo yêu cầu rút ${formatCurrency(amount)}! Ban quản trị sẽ duyệt lệnh trong 2-4 giờ.`,
        );
        setOrderId('');
        setAmount(0);
        asyncLedgers.reload();
      } else {
        toast.info('Yêu cầu rút tiền đã được ghi nhận. Vui lòng kiểm tra lại lịch sử.');
      }
    });
  }

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Kênh Xưởng', to: routes.vendor.overview },
          { label: 'Ví & Tài chính', to: routes.vendor.money },
          { label: 'Yêu cầu giải ngân Escrow' },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Giải Ngân Tiền Ký Quỹ Escrow</h1>
          <p className={styles.subtitle}>
            Rút tiền doanh thu từ các đơn hàng đã được người mua xác nhận hoàn tất
          </p>
        </div>
      </div>

      <div className={styles.gridTwo}>
        <Card padding="lg" className={styles.cardBody}>
          <h2 className={styles.sectionTitle}>Tạo Lệnh Rút Tiền Về Tài Khoản</h2>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Số dư khả dụng có thể rút ngay:</span>
            <div className={styles.statValue}>{formatCurrency(availableBalance)}</div>
          </div>

          <form onSubmit={handleRequestDisbursement} className={styles.cardBody}>
            <div>
              <Select
                label="Đơn hàng cần giải ngân"
                required
                placeholder="— Chọn đơn hàng —"
                options={payableLedgers.map((l) => ({
                  value: l.orderId,
                  label: `#${l.orderId} · ${formatCurrency(l.toReceive ?? 0)}`,
                }))}
                value={orderId}
                onChange={(v) => {
                  setOrderId(v);
                  const next = ledgers.find((l) => l.orderId === v);
                  setAmount(next?.toReceive ?? 0);
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
                max={availableBalance}
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
              className={styles.fullWidthButton}
            >
              Xác Nhận Tạo Lệnh Giải Ngân
            </Button>
          </form>
        </Card>

        <Card padding="lg" className={styles.cardBody}>
          <h2 className={styles.sectionTitle}>Lịch Sử Lệnh Rút Gần Đây</h2>
          <AsyncState
            state={asyncLedgers}
            onRetry={asyncLedgers.reload}
            loadingMessage="Đang tải lịch sử giải ngân..."
            isEmpty={() => ledgers.length === 0}
            empty={
              <EmptyState
                icon="wallet"
                title="Chưa có lệnh giải ngân nào"
                description="Các đơn hàng đủ điều kiện sẽ hiện ở đây để Shop gửi yêu cầu rút tiền."
              />
            }
          >
            {() => (
              <div className={styles.stack}>
                {ledgers.map((l) => (
                  <div key={l.orderId} className={styles.keyValueRow}>
                    <div>
                      <div className={styles.keyValueLabel}>#{l.orderId}</div>
                      <div className={styles.statLabel}>
                        {l.expectedPayoutDate || 'Chưa có ngày chi'}
                      </div>
                    </div>
                    <div className={styles.rightText}>
                      <div className={styles.moneyText}>{formatCurrency(l.toReceive ?? 0)}</div>
                      {l.paidOut ? (
                        <Badge tone="green" size="sm">
                          Đã hoàn tất
                        </Badge>
                      ) : l.disputeOpen ? (
                        <Badge tone="red" size="sm">
                          Khóa khiếu nại
                        </Badge>
                      ) : l.payable ? (
                        <Badge tone="blue" size="sm">
                          Đủ điều kiện rút
                        </Badge>
                      ) : (
                        <Badge tone="neutral" size="sm">
                          Chờ người mua xác nhận
                        </Badge>
                      )}
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
