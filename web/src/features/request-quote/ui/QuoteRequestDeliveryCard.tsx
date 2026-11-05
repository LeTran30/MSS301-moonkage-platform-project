import { Card, Input, Select } from '@/shared/ui';
import { provinceNameOf } from '@/shared/config';
import styles from './QuoteRequestCards.module.css';

interface QuoteRequestDeliveryCardProps {
  recipientName: string;
  onRecipientNameChange: (value: string) => void;
  recipientPhone: string;
  onRecipientPhoneChange: (value: string) => void;
  deliveryAddress: string;
  onDeliveryAddressChange: (value: string) => void;
  provinceCode: string;
  onProvinceCodeChange: (value: string) => void;
  provinceOptions: Array<{ value: string; label: string }>;
  /** Lỗi theo tên trường, do form cha sở hữu (FR-16). */
  errors?: Partial<Record<'recipientName' | 'recipientPhone' | 'deliveryAddress', string>>;
}

/**
 * Step 2 of the quote request form: where the order goes.
 *
 * `provinceCode` decides the delivery fee (BR-30), so the line under the form
 * shows the province the fee is computed for.
 */
export function QuoteRequestDeliveryCard({
  recipientName,
  onRecipientNameChange,
  recipientPhone,
  onRecipientPhoneChange,
  deliveryAddress,
  onDeliveryAddressChange,
  provinceCode,
  onProvinceCodeChange,
  provinceOptions,
  errors,
}: QuoteRequestDeliveryCardProps) {
  return (
    <Card padding="lg" className={styles.card}>
      <h3 className={styles.cardTitle}>2. Địa chỉ nhận hàng</h3>

      <div className={styles.grid2}>
        <Input
          label="Người nhận"
          value={recipientName}
          onChange={(e) => onRecipientNameChange(e.target.value)}
          required
          error={errors?.recipientName}
        />
        <Input
          label="Số điện thoại người nhận"
          value={recipientPhone}
          onChange={(e) => onRecipientPhoneChange(e.target.value)}
          required
          error={errors?.recipientPhone}
          hint={errors?.recipientPhone ? undefined : '10 số, bắt đầu bằng 0'}
        />
      </div>

      <div className={styles.grid2}>
        <Input
          label="Địa chỉ nhận hàng chi tiết"
          value={deliveryAddress}
          onChange={(e) => onDeliveryAddressChange(e.target.value)}
          required
          error={errors?.deliveryAddress}
        />
        <Select
          label="Tỉnh / Thành phố"
          options={provinceOptions}
          value={provinceCode}
          onChange={(v) => onProvinceCodeChange(v)}
          required
        />
      </div>
      <p className={styles.hintLine}>
        Khu vực giao: <strong>{provinceNameOf(provinceCode) || 'Hà Nội'}</strong> — phí vận chuyển
        liên tỉnh được tính theo tỉnh này.
      </p>
    </Card>
  );
}
