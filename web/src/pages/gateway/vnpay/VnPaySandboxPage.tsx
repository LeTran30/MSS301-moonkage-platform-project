import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency, generateEntityId } from '@/shared/utils';
import { Button, Card, Icon, toast } from '@/shared/ui';
import styles from './VnPaySandboxPage.module.css';

type VnPayState = {
  amount: number;
  orderIds: string[];
  type: string;
  /** The checkout that created the payment; the result page reads it (AC-09.7). */
  checkoutId?: string;
};

export function VnPaySandboxPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const state = (location.state as VnPayState | null) || {
    amount: 975000,
    orderIds: ['MK-1042'],
    type: 'RETAIL',
  };

  function handleCompletePayment(success: boolean) {
    if (success) {
      navigate(routes.base.paymentResult, {
        state: {
          success: true,
          paymentId: paymentId || generateEntityId('PAY'),
          checkoutId: state.checkoutId,
          amount: state.amount,
          orderIds: state.orderIds,
          type: state.type,
        },
      });
    } else {
      toast.error('Thanh toán thất bại hoặc người dùng hủy giao dịch.');
      navigate(routes.base.cart);
    }
  }

  return (
    <div className={styles.sandbox}>
      <div className={styles.header}>
        <div className={styles.vnpayLogo}>
          <span className={styles.red}>VN</span>
          <span className={styles.blue}>PAY</span>
          <span className={styles.sandboxTag}>SANDBOX SIMULATOR (M4.2)</span>
        </div>
        <div className={styles.merchant}>Đơn vị chấp nhận: <strong>MOONKAGE PLATFORM</strong></div>
      </div>

      <div className={styles.container}>
        <Card padding="lg" className={styles.card}>
          <div className={styles.amountBox}>
            <span className={styles.amountLabel}>Số tiền thanh toán:</span>
            <span className={styles.amountVal}>{formatCurrency(state.amount || 0)}</span>
          </div>

          <div className={styles.metaBox}>
            <div className={styles.metaRow}>
              <span>Mã giao dịch:</span>
              <code>{paymentId}</code>
            </div>
            <div className={styles.metaRow}>
              <span>Mã đơn hàng liên quan:</span>
              <strong>{state.orderIds?.join(', ')}</strong>
            </div>
            <div className={styles.metaRow}>
              <span>Mục đích thanh toán:</span>
              <span>{state.type === 'BULK_DEPOSIT' ? 'Thanh toán cọc đơn đặt hàng (F2)' : state.type === 'BULK_REMAINING' ? 'Thanh toán phần còn lại (F2)' : state.type === 'OPENING_FEE' ? 'Phí mở bán người bán (200.000đ - FR-53)' : 'Thanh toán đơn mua lẻ (F1)'}</span>
            </div>
          </div>

          <div className={styles.qrArea}>
            <div className={styles.qrMock}>
              <Icon name="qr" size={120} />
            </div>
            <p className={styles.qrTip}>Quét mã QR bằng ứng dụng ngân hàng hoặc Mobile Money</p>
          </div>

          <div className={styles.actions}>
            <Button variant="primary" size="lg" block iconLeft="check" onClick={() => handleCompletePayment(true)}>
              [Giả lập] Thanh toán thành công (Success)
            </Button>
            <Button variant="secondary" size="md" block onClick={() => handleCompletePayment(false)}>
              [Giả lập] Hủy / Giao dịch thất bại
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
