import { useState } from 'react';
import { routes } from '@/shared/config';
import { formatCurrency, formatDateTime } from '@/shared/utils';
import { AsyncState, Breadcrumbs, Button, Card, EmptyState, Modal, Textarea, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useWalletSummary, useWithdrawals, type WithdrawalDto } from '@/entities/payment';
import { reviewWithdrawal } from '@/features/review-withdrawal';
import styles from './AdminWithdrawalsPage.module.css';

type Decision = { withdrawal: WithdrawalDto; status: 'COMPLETED' | 'REJECTED' };

/**
 * Yêu cầu rút tiền từ ví người mua (Q-01).
 *
 * Quản trị viên chuyển khoản thủ công theo thông tin ngân hàng, rồi bấm "Đã
 * chuyển khoản". Từ chối cần lý do; tiền tự trả lại ví. Người mua nhận email
 * trong cả hai trường hợp.
 */
export function AdminWithdrawalsPage() {
  const pending = useWithdrawals('PENDING');
  const summary = useWalletSummary();
  const { busy, run } = useAction();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState('');

  function close() {
    setDecision(null);
    setReason('');
  }

  function confirm() {
    if (!decision) return;
    if (decision.status === 'REJECTED' && !reason.trim()) {
      toast.warning('Hãy ghi lý do từ chối để người mua biết.');
      return;
    }
    void run(async () => {
      await reviewWithdrawal(
        decision.withdrawal.id,
        decision.status === 'REJECTED'
          ? { status: 'REJECTED', reason: reason.trim() }
          : { status: 'COMPLETED' },
      );
      toast.success(
        decision.status === 'COMPLETED'
          ? 'Đã xác nhận chuyển khoản. Người mua đã được báo qua email.'
          : 'Đã từ chối. Tiền đã trả lại ví người mua.',
      );
      close();
      pending.reload();
      summary.reload();
    });
  }

  const totals = summary.kind === 'loaded' ? summary.data : null;

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Quản trị', to: routes.admin.overview },
          { label: 'Quản lý tài chính', to: routes.admin.money },
          { label: 'Rút tiền từ ví' },
        ]}
      />

      <div>
        <h1 className={styles.title}>Yêu cầu rút tiền từ ví</h1>
        <p className={styles.subtitle}>
          Chuyển khoản theo thông tin bên dưới, rồi xác nhận để báo cho người mua.
        </p>
        {totals && (
          <p className={styles.summary}>
            Ví người mua đang giữ <strong>{formatCurrency(totals.totalBalance)}</strong> · Chờ
            chuyển <strong>{totals.pendingWithdrawals}</strong> yêu cầu,{' '}
            <strong>{formatCurrency(totals.pendingWithdrawalAmount)}</strong>
          </p>
        )}
      </div>

      <Card padding="none" className={styles.tableWrap}>
        <AsyncState
          state={pending}
          onRetry={pending.reload}
          loadingMessage="Đang tải yêu cầu rút tiền…"
          isEmpty={(list) => list.length === 0}
          empty={
            <EmptyState
              icon="wallet"
              title="Không có yêu cầu nào đang chờ"
              description="Yêu cầu rút tiền mới của người mua sẽ hiện ở đây."
            />
          }
        >
          {(list) => (
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHead}>
                  <th className={styles.cell}>Gửi lúc</th>
                  <th className={styles.cell}>Ngân hàng</th>
                  <th className={styles.cell}>Số tài khoản</th>
                  <th className={styles.cell}>Chủ tài khoản</th>
                  <th className={styles.cell}>Số tiền</th>
                  <th className={styles.cell}>Xử lý</th>
                </tr>
              </thead>
              <tbody>
                {list.map((w) => (
                  <tr key={w.id} className={styles.row}>
                    <td className={styles.cellMuted}>{formatDateTime(w.createdAt)}</td>
                    <td className={styles.cell}>{w.bankName}</td>
                    <td className={styles.cellMono}>{w.accountNumber}</td>
                    <td className={styles.cell}>{w.accountName}</td>
                    <td className={styles.cellMoney}>{formatCurrency(w.amount)}</td>
                    <td className={styles.cell}>
                      <div className={styles.actions}>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => setDecision({ withdrawal: w, status: 'COMPLETED' })}
                        >
                          Đã chuyển khoản
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDecision({ withdrawal: w, status: 'REJECTED' })}
                        >
                          Từ chối
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AsyncState>
      </Card>

      <Modal
        open={decision !== null}
        onClose={close}
        title={decision?.status === 'REJECTED' ? 'Từ chối yêu cầu rút tiền' : 'Xác nhận đã chuyển khoản'}
        description={
          decision
            ? `${formatCurrency(decision.withdrawal.amount)} tới ${decision.withdrawal.bankName}, tài khoản ${decision.withdrawal.accountNumber} (${decision.withdrawal.accountName}).`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Hủy
            </Button>
            <Button
              variant={decision?.status === 'REJECTED' ? 'danger' : 'primary'}
              loading={busy}
              onClick={confirm}
            >
              {decision?.status === 'REJECTED' ? 'Từ chối và trả lại ví' : 'Tôi đã chuyển khoản'}
            </Button>
          </>
        }
      >
        {decision?.status === 'REJECTED' ? (
          <Textarea
            label="Lý do từ chối"
            required
            rows={3}
            maxLength={2000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Tên chủ tài khoản không khớp với số tài khoản"
          />
        ) : (
          <p className={styles.subtitle}>
            Chỉ xác nhận sau khi giao dịch chuyển khoản đã thành công. Người mua sẽ nhận email báo
            tiền đã được chuyển.
          </p>
        )}
      </Modal>
    </div>
  );
}
