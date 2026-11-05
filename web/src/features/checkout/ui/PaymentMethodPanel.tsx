import { Card, Icon, Radio } from '@/shared/ui';
import styles from './checkoutUi.module.css';

/**
 * Phương thức thanh toán của checkout (M4.2).
 *
 * Hiện chỉ có cổng VNPay (Sandbox); radio được khoá để không đổi nhầm.
 */
export function PaymentMethodPanel() {
  return (
    <Card padding="md" className={styles.sectionCard}>
      <div className={styles.cardHeader}>
        <Icon name="creditCard" size={18} />
        <h3>Phương thức thanh toán</h3>
      </div>
      <div className={styles.paymentMethod}>
        <div className={styles.vnpayRadio}>
          <Radio checked readOnly aria-label="Cổng VNPay" inputClassName={styles.vnpayRadioInput} />
          <div>
            <strong>Cổng thanh toán VNPay (Sandbox)</strong>
            <p>
              Hỗ trợ quét mã VNPAY-QR, thẻ ATM nội địa mọi ngân hàng và thẻ Visa/Mastercard.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
