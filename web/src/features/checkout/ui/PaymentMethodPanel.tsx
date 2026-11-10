import { Card, Icon, Radio } from '@/shared/ui';
import { formatCurrency } from '@/shared/utils';
import { useMyWallet } from '@/entities/payment';
import styles from './checkoutUi.module.css';

export type CheckoutPaymentMethod = 'VNPAY' | 'WALLET';

type Props = {
  value: CheckoutPaymentMethod;
  onChange: (method: CheckoutPaymentMethod) => void;
  /** What the whole checkout costs; the wallet is offered only when it covers it. */
  total: number;
};

/**
 * Phương thức thanh toán của checkout (M4.2): cổng VNPay, hoặc ví Moonkage
 * khi số dư đủ trả cả lượt thanh toán (Q-01).
 */
export function PaymentMethodPanel({ value, onChange, total }: Props) {
  const wallet = useMyWallet();
  const balance = wallet.kind === 'loaded' ? wallet.data.balance : 0;
  const walletCovers = balance >= total && total > 0;

  return (
    <Card padding="md" className={styles.sectionCard}>
      <div className={styles.cardHeader}>
        <Icon name="creditCard" size={18} />
        <h3>Phương thức thanh toán</h3>
      </div>
      <div className={styles.paymentMethod} role="radiogroup" aria-label="Phương thức thanh toán">
        <label className={styles.vnpayRadio}>
          <Radio
            name="payment-method"
            checked={value === 'VNPAY'}
            onChange={() => onChange('VNPAY')}
            aria-label="Cổng VNPay"
            inputClassName={styles.vnpayRadioInput}
          />
          <div>
            <strong>Cổng thanh toán VNPay (Sandbox)</strong>
            <p>Hỗ trợ quét mã VNPAY-QR, thẻ ATM nội địa mọi ngân hàng và thẻ Visa/Mastercard.</p>
          </div>
        </label>
        {balance > 0 && (
          <label className={styles.vnpayRadio}>
            <Radio
              name="payment-method"
              checked={value === 'WALLET'}
              disabled={!walletCovers}
              onChange={() => onChange('WALLET')}
              aria-label="Ví Moonkage"
              inputClassName={styles.vnpayRadioInput}
            />
            <div>
              <strong>Ví Moonkage</strong>
              <p>
                Số dư {formatCurrency(balance)}
                {walletCovers ? '. Thanh toán ngay, không cần chuyển sang VNPay.' : ', chưa đủ cho đơn này.'}
              </p>
            </div>
          </label>
        )}
      </div>
    </Card>
  );
}
