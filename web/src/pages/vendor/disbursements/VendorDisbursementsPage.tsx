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
  useDisbursementRequests,
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

  const asyncData = useDisbursementRequests({ vendorId: user.vendorId });
  const requestDisbursement = useRequestDisbursement();

  const data = asyncData.kind === 'loaded' ? asyncData.data : { ledgers: [], requests: [] };
  const ledgers = data.ledgers;
  const requests = [...data.requests].sort((a, b) =>
    (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
  );
  const eligibleLedgers = ledgers.filter((l) => l.disbursementEligible);
  const availableBalance = ledgers.reduce(
    (acc, l) => acc + (l.remainingDisbursable ?? 0),
    0,
  );
  const selectedLedger = eligibleLedgers.find((l) => l.orderId === orderId);
  const selectedAvailable = selectedLedger?.remainingDisbursable ?? 0;

  function handleRequestDisbursement(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId) {
      toast.error('Vui lòng chọn đơn hàng cần giải ngân.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > selectedAvailable) {
      toast.error('Số tiền giải ngân vượt quá tiền cọc còn lại của đơn đã chọn.');
      return;
    }
    void run(async () => {
      const created = await requestDisbursement(orderId, {
        amount,
        purpose,
      });
      if (created) {
        toast.success(
          `Đã gửi yêu cầu giải ngân ${formatCurrency(amount)}. Ban quản trị sẽ xét duyệt yêu cầu.`,
        );
        setOrderId('');
        setAmount(0);
        asyncData.reload();
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
            Yêu cầu giải ngân sớm một phần tiền cọc của đơn đặt hàng
          </p>
        </div>
      </div>

      <div className={styles.gridTwo}>
        <Card padding="lg" className={styles.cardBody}>
          <h2 className={styles.sectionTitle}>Tạo yêu cầu giải ngân</h2>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Tổng tiền cọc còn có thể yêu cầu:</span>
            <div className={styles.statValue}>{formatCurrency(availableBalance)}</div>
          </div>

          <form onSubmit={handleRequestDisbursement} className={styles.cardBody}>
            <div>
              <Select
                label="Đơn hàng cần giải ngân"
                required
                placeholder="— Chọn đơn hàng —"
                options={eligibleLedgers.map((l) => ({
                  value: l.orderId,
                  label: `#${l.orderId} · còn ${formatCurrency(l.remainingDisbursable ?? 0)}`,
                }))}
                value={orderId}
                onChange={(v) => {
                  setOrderId(v);
                  const next = ledgers.find((l) => l.orderId === v);
                  setAmount(next?.remainingDisbursable ?? 0);
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
                max={selectedAvailable}
                min={1}
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
              Gửi Yêu Cầu Giải Ngân
            </Button>
          </form>
        </Card>

        <Card padding="lg" className={styles.cardBody}>
          <h2 className={styles.sectionTitle}>Yêu cầu gần đây</h2>
          <AsyncState
            state={asyncData}
            onRetry={asyncData.reload}
            loadingMessage="Đang tải lịch sử giải ngân..."
            isEmpty={() => requests.length === 0}
            empty={
              <EmptyState
                icon="wallet"
                title="Chưa có yêu cầu giải ngân nào"
                description="Yêu cầu đã gửi sẽ xuất hiện ở đây cùng trạng thái xét duyệt."
              />
            }
          >
            {() => (
              <div className={styles.stack}>
                {requests.map((request) => (
                  <div key={request.requestId} className={styles.keyValueRow}>
                    <div>
                      <div className={styles.keyValueLabel}>Đơn #{request.orderId}</div>
                      <div className={styles.statLabel}>
                        {payoutPurposeLabel(request.purpose ?? '')}
                        {request.createdAt
                          ? ` · ${new Date(request.createdAt).toLocaleString('vi-VN')}`
                          : ''}
                      </div>
                      {request.reason && (
                        <div className={styles.rejectionReason}>Lý do: {request.reason}</div>
                      )}
                    </div>
                    <div className={styles.rightText}>
                      <div className={styles.moneyText}>
                        {formatCurrency(request.approvedAmount ?? request.amount ?? 0)}
                      </div>
                      <Badge
                        tone={
                          request.status === 'APPROVED'
                            ? 'green'
                            : request.status === 'REJECTED'
                              ? 'red'
                              : 'amber'
                        }
                        size="sm"
                      >
                        {request.status === 'APPROVED'
                          ? 'Đã duyệt'
                          : request.status === 'REJECTED'
                            ? 'Bị từ chối'
                            : 'Đang chờ'}
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
