import { PROVINCE_ITEMS } from '@/shared/config';
import { Card, Icon, Input, Select } from '@/shared/ui';
import styles from './checkoutUi.module.css';

interface ShippingAddressFormProps {
  receiver: string;
  phone: string;
  address: string;
  provinceCode: string;
  onReceiverChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onProvinceCodeChange: (value: string) => void;
}

/** Thông tin địa chỉ nhận bánh của checkout (FR-08). */
export function ShippingAddressForm({
  receiver,
  phone,
  address,
  provinceCode,
  onReceiverChange,
  onPhoneChange,
  onAddressChange,
  onProvinceCodeChange,
}: ShippingAddressFormProps) {
  return (
    <Card padding="md" className={styles.sectionCard}>
      <div className={styles.cardHeader}>
        <Icon name="mapPin" size={18} />
        <h3>Địa chỉ nhận bánh</h3>
      </div>

      <div className={styles.inputGrid}>
        <Input
          label="Họ tên người nhận"
          value={receiver}
          onChange={(e) => onReceiverChange(e.target.value)}
          required
        />
        <Input
          label="Số điện thoại"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          inputMode="numeric"
          hint="10 chữ số, bắt đầu bằng 0"
          required
        />
      </div>
      <Input
        label="Địa chỉ chi tiết (số nhà, ngõ, đường)"
        value={address}
        onChange={(e) => onAddressChange(e.target.value)}
        required
      />
      <Select
        label="Tỉnh / Thành phố"
        options={PROVINCE_ITEMS.map((p) => ({ value: p.code, label: p.officialName }))}
        value={provinceCode}
        onChange={(e) => onProvinceCodeChange(e.target.value)}
        required
      />
    </Card>
  );
}
