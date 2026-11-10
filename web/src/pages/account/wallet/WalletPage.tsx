import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency, formatDateTime } from '@/shared/utils';
import { Button, Card, EmptyState } from '@/shared/ui';
import { orderCode } from '@/entities/order';
import { useMyWallet, type WalletEntryDto } from '@/entities/payment';
import styles from './WalletPage.module.css';

/** What one line of the history means to the buyer. */
function entryText(entry: WalletEntryDto) {
  if (entry.reason === 'ORDER_REJECTED') {
    return (
      <>
        Hoàn tiền: shop từ chối đơn{' '}
        <Link to={routes.account.order(entry.referenceId)}>#{orderCode(entry.referenceId)}</Link>
      </>
    );
  }
  return 'Thanh toán đơn hàng bằng ví';
}

/**
 * Ví Moonkage của người mua (Q-01).
 *
 * Tiền của đơn bị shop từ chối được hoàn về đây; người mua dùng số dư để thanh
 * toán lần sau. Lịch sử chỉ đọc: mỗi dòng là một lần tiền vào hoặc ra.
 */
export function WalletPage() {
  const wallet = useMyWallet();

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

  return (
    <div className={styles.container}>
      <div>
        <h1 className={styles.title}>Ví của tôi</h1>
        <p className={styles.lead}>
          Khi shop từ chối đơn đã thanh toán, tiền của đơn đó được hoàn vào đây. Bạn có thể dùng
          số dư để thanh toán đơn tiếp theo.
        </p>
      </div>

      <Card padding="lg">
        <p className={styles.balanceLabel}>Số dư hiện có</p>
        <p className={styles.balance}>{formatCurrency(balance)}</p>
      </Card>

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
    </div>
  );
}
