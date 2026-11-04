import styles from './AdminReconciliationPage.module.css';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Button, Card, Breadcrumbs, AsyncState, toast } from '@/shared/ui';
import { useLedgerList } from '@/entities/payment';

/**
 * Q4.3 — the money of the whole platform.
 *
 * Every number comes from `GET /api/ledgers` (admin: every ledger). Moonkage
 * charges no commission (BR-10), so the platform's fee is the refunds it
 * already booked.
 */
export function AdminReconciliationPage() {
  const asyncLedgers = useLedgerList();

  const ledgers = asyncLedgers.kind === 'loaded' ? asyncLedgers.data : [];

  const totalGMV = ledgers.reduce((acc, l) => acc + (l.totalCollected ?? 0), 0);
  const platformFeeEarned = ledgers.reduce((acc, l) => acc + (l.refunded ?? 0), 0);
  const escrowHolding = ledgers.reduce((acc, l) => acc + (l.held ?? 0), 0);
  const totalDisbursed = ledgers.reduce((acc, l) => acc + (l.paidOut ?? 0), 0);

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Quản Trị', to: routes.admin.overview },
          { label: 'Quản lý tài chính', to: routes.admin.money },
          { label: 'Đối soát toàn sàn' },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Đối Soát &amp; Báo Cáo Tài Chính Toàn Sàn (Q4.3)</h1>
          <p className={styles.subtitle}>
            Tổng hợp dòng tiền GMV, khoản đã hoàn trả và số dư ký quỹ Escrow đang bảo chứng
          </p>
        </div>
        <Button
          variant="outline"
          iconLeft="download"
          onClick={() => toast.info('Đang xuất sổ cái kế toán...')}
        >
          Xuất Sổ Cái Kế Toán
        </Button>
      </div>

      <AsyncState
        state={asyncLedgers}
        onRetry={asyncLedgers.reload}
        loadingMessage="Đang tổng hợp số liệu tài chính toàn sàn..."
      >
        {() => (
          <div className={styles.statGrid}>
            <Card padding="md">
              <div className={styles.statLabel}>Tổng GMV Toàn Sàn</div>
              <div className={styles.statValuePrimary}>{formatCurrency(totalGMV)}</div>
            </Card>
            <Card padding="md">
              <div className={styles.statLabel}>Đã Hoàn Trả Người Mua</div>
              <div className={styles.statValueGold}>{formatCurrency(platformFeeEarned)}</div>
            </Card>
            <Card padding="md">
              <div className={styles.statLabel}>Ký Quỹ Escrow Đang Tạm Giữ</div>
              <div className={styles.statValueBlue}>{formatCurrency(escrowHolding)}</div>
            </Card>
            <Card padding="md">
              <div className={styles.statLabel}>Đã Giải Ngân Cho Xưởng</div>
              <div className={styles.statValueGreen}>{formatCurrency(totalDisbursed)}</div>
            </Card>
          </div>
        )}
      </AsyncState>
    </div>
  );
}

