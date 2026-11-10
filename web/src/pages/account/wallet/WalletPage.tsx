import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency, formatDateTime } from '@/shared/utils';
import { Badge, Button, Card, EmptyState } from '@/shared/ui';
import { orderCode } from '@/entities/order';
import {
  useMyWallet,
  useMyWithdrawals,
  type WalletEntryDto,
  type WithdrawalDto,
} from '@/entities/payment';
import { WithdrawMoneyModal } from '@/features/withdraw-money';
import styles from './WalletPage.module.css';

/** What one line of the history means to the buyer. */
function entryText(entry: WalletEntryDto) {
  switch (entry.reason) {
    case 'ORDER_REJECTED':
      return (
        <>
          Hoàn tiền: shop từ chối đơn{' '}
          <Link to={routes.account.order(entry.referenceId)}>#{orderCode(entry.referenceId)}</Link>
        </>
      );
    case 'PAYMENT':
      return 'Thanh toán đơn hàng bằng ví';
    case 'REFUND':
      return 'Hoàn tiền một khoản đã thanh toán bằng ví';
    case 'WITHDRAWAL':
      return 'Rút tiền về ngân hàng';
    case 'WITHDRAWAL_RETURNED':
      return 'Trả lại tiền: yêu cầu rút tiền bị từ chối';
  }
}

const WITHDRAWAL_STATE: Record<WithdrawalDto['status'], { tone: 'gold' | 'green' | 'red'; label: string }> = {
  PENDING: { tone: 'gold', label: 'Đang chờ chuyển' },
  COMPLETED: { tone: 'green', label: 'Đã chuyển' },
  REJECTED: { tone: 'red', label: 'Bị từ chối' },
};

/**
 * Ví Moonkage của người mua (Q-01).
 *
 * Tiền của đơn bị shop từ chối được hoàn về đây; người mua dùng số dư để thanh
 * toán lần sau hoặc rút về tài khoản ngân hàng. Lịch sử chỉ đọc.
 */
export function WalletPage() {
  const wallet = useMyWallet();
  const withdrawals = useMyWithdrawals();
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  if (wallet.kind === 'loading') {
    return <p>Đang tải ví…</p>;
  }
  if (wallet.kind === 'error') {
    return (
      <div className={styles.container}>
        <p role="alert">{wallet.message}</p>
        <Button variant="outline" onClick={wallet.reload}>
          Thử lại
        </Button>
      </div>
    );
  }
  const { balance, entries } = wallet.data;
  const requests = withdrawals.kind === 'loaded' ? withdrawals.data : [];

  return (
    <div className={styles.container}>
      <div>
        <h1 className={styles.title}>Ví của tôi</h1>
        <p className={styles.lead}>
          Khi shop từ chối đơn đã thanh toán, tiền của đơn đó được hoàn vào đây. Bạn có thể dùng
          số dư để thanh toán đơn tiếp theo hoặc rút về tài khoản ngân hàng.
        </p>
      </div>

      <Card padding="lg" className={styles.balanceCard}>
        <div>
          <p className={styles.balanceLabel}>Số dư hiện có</p>
          <p className={styles.balance}>{formatCurrency(balance)}</p>
        </div>
        <Button variant="primary" disabled={balance <= 0} onClick={() => setWithdrawOpen(true)}>
          Rút tiền về ngân hàng
        </Button>
      </Card>

      {requests.length > 0 && (
        <Card padding="md">
          <h2 className={styles.sectionTitle}>Yêu cầu rút tiền</h2>
          <ul className={styles.list}>
            {requests.map((w) => (
              <li key={w.id} className={styles.row}>
                <div>
                  <div className={styles.rowTitle}>
                    {w.bankName} · {w.accountNumber}
                  </div>
                  <div className={styles.rowMeta}>
                    {formatDateTime(w.createdAt)}
                    {w.status === 'REJECTED' && w.rejectReason ? ` · Lý do: ${w.rejectReason}` : ''}
                  </div>
                </div>
                <div className={styles.rowRight}>
                  <strong>{formatCurrency(w.amount)}</strong>
                  <Badge tone={WITHDRAWAL_STATE[w.status].tone} size="sm">
                    {WITHDRAWAL_STATE[w.status].label}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card padding="md">
        <h2 className={styles.sectionTitle}>Lịch sử giao dịch</h2>
        {entries.length === 0 ? (
          <EmptyState
            icon="wallet"
            title="Chưa có giao dịch nào"
            description="Tiền hoàn từ các đơn bị shop từ chối sẽ hiện ở đây."
          />
        ) : (
          <ul className={styles.list}>
            {entries.map((entry) => (
              <li key={entry.id} className={styles.row}>
                <div>
                  <div className={styles.rowTitle}>{entryText(entry)}</div>
                  <div className={styles.rowMeta}>{formatDateTime(entry.createdAt)}</div>
                </div>
                <strong className={entry.kind === 'CREDIT' ? styles.credit : styles.debit}>
                  {entry.kind === 'CREDIT' ? '+' : '−'}
                  {formatCurrency(entry.amount)}
                </strong>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <WithdrawMoneyModal
        open={withdrawOpen}
        balance={balance}
        onClose={() => setWithdrawOpen(false)}
        onDone={() => {
          wallet.reload();
          withdrawals.reload();
        }}
      />
    </div>
  );
}
