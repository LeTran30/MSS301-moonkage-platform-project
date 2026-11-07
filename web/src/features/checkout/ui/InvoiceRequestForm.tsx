import { Card, Checkbox, Icon, Input } from '@/shared/ui';
import styles from './checkoutUi.module.css';

interface InvoiceRequestFormProps {
  /** Số kiện hàng trong lượt thanh toán (thông tin áp dụng cho tất cả). */
  orderCount: number;
  /** Câu giải thích thay cho câu mặc định về lượt thanh toán, ví dụ khi đặt cọc đơn đặt riêng. */
  description?: string;
  needInvoice: boolean;
  companyName: string;
  taxCode: string;
  companyAddress: string;
  companyEmail: string;
  onNeedInvoiceChange: (value: boolean) => void;
  onCompanyNameChange: (value: string) => void;
  onTaxCodeChange: (value: string) => void;
  onCompanyAddressChange: (value: string) => void;
  onCompanyEmailChange: (value: string) => void;
}

/**
 * Yêu cầu xuất hóa đơn GTGT điện tử doanh nghiệp (FR-09, FR-24).
 *
 * Thông tin nhập một lần được áp dụng cho toàn bộ đơn hàng trong lượt thanh toán.
 */
export function InvoiceRequestForm({
  orderCount,
  description,
  needInvoice,
  companyName,
  taxCode,
  companyAddress,
  companyEmail,
  onNeedInvoiceChange,
  onCompanyNameChange,
  onTaxCodeChange,
  onCompanyAddressChange,
  onCompanyEmailChange,
}: InvoiceRequestFormProps) {
  return (
    <Card padding="md" className={styles.sectionCard}>
      <div className={styles.invoiceToggleRow}>
        <div className={styles.invoiceToggleInfo}>
          <div className={styles.invoiceToggleTitle}>
            <Icon name="receipt" size={18} />
            <h3>Xuất hóa đơn GTGT điện tử (Doanh nghiệp)</h3>
          </div>
          <p className={styles.invoiceToggleDesc}>
            {description ??
              `Thông tin xuất hóa đơn sẽ được áp dụng tự động cho toàn bộ ${orderCount} đơn hàng trong lần thanh toán này.`}
          </p>
        </div>
        <Checkbox
          inputClassName={styles.checkbox}
          checked={needInvoice}
          onChange={(e) => onNeedInvoiceChange(e.target.checked)}
          aria-label="Yêu cầu xuất hóa đơn GTGT"
        />
      </div>

      {needInvoice && (
        <div className={styles.invoiceFields}>
          <Input
            label="Tên công ty / Tổ chức"
            value={companyName}
            onChange={(e) => onCompanyNameChange(e.target.value)}
            required
          />
          <div className={styles.inputGrid}>
            <Input
              label="Mã số thuế"
              value={taxCode}
              onChange={(e) => onTaxCodeChange(e.target.value)}
              required
            />
            <Input
              label="Email nhận hóa đơn"
              value={companyEmail}
              onChange={(e) => onCompanyEmailChange(e.target.value)}
              required
            />
          </div>
          <Input
            label="Địa chỉ đăng ký kinh doanh"
            value={companyAddress}
            onChange={(e) => onCompanyAddressChange(e.target.value)}
            required
          />
        </div>
      )}
    </Card>
  );
}
