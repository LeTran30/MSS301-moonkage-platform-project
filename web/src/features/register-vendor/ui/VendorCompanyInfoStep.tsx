import { PROVINCE_ITEMS } from '@/shared/config';
import { Button, Input, Select } from '@/shared/ui';
import type { VendorRegistrationForm } from '../model/vendorRegistrationForm';
import styles from './VendorCompanyInfoStep.module.css';

interface VendorCompanyInfoStepProps {
  form: VendorRegistrationForm;
  /** Lỗi theo tên trường; `Input` tự gắn `aria-invalid`/`aria-describedby` khi có. */
  errors?: Partial<Record<keyof VendorRegistrationForm, string>>;
  onChange: (patch: Partial<VendorRegistrationForm>) => void;
  onBack: () => void;
  onNext: () => void;
}

/** Bước 2: thông tin đơn vị, chủ hộ và tài khoản nhận tiền. */
export function VendorCompanyInfoStep({
  form,
  errors = {},
  onChange,
  onBack,
  onNext,
}: VendorCompanyInfoStepProps) {
  return (
    <div className={styles.stepContent}>
      <h3>Bước 2: Thông tin đơn vị &amp; Chủ hộ kinh doanh</h3>
      <div className={styles.grid2}>
        <Input
          label="Tên thương hiệu / Tên Shop hiển thị"
          value={form.shopName}
          error={errors.shopName}
          onChange={(e) => onChange({ shopName: e.target.value })}
          required
        />
        <Input
          label="Tên đầy đủ trên Giấy phép ĐKKD"
          value={form.legalName}
          error={errors.legalName}
          onChange={(e) => onChange({ legalName: e.target.value })}
          required
        />
      </div>
      <div className={styles.grid2}>
        <Input
          label="Mã số thuế"
          value={form.taxCode}
          error={errors.taxCode}
          onChange={(e) => onChange({ taxCode: e.target.value })}
          required
        />
        <Input
          label="Số điện thoại liên hệ"
          value={form.phone}
          error={errors.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          required
        />
      </div>
      <Input
        label="Địa chỉ trụ sở / Xưởng sản xuất"
        value={form.address}
        error={errors.address}
        onChange={(e) => onChange({ address: e.target.value })}
        required
      />
      <Select
        label="Tỉnh / Thành phố trụ sở"
        options={PROVINCE_ITEMS.map((p) => ({ value: p.code, label: p.name }))}
        value={form.provinceCode}
        onChange={(v) => onChange({ provinceCode: v })}
        required
      />
      <div className={styles.grid2}>
        <Input
          label="Họ tên người đại diện pháp luật / Chủ hộ"
          value={form.representativeName}
          error={errors.representativeName}
          onChange={(e) => onChange({ representativeName: e.target.value })}
          required
        />
        <Input
          label="Số CCCD đã che (hoặc đầy đủ)"
          value={form.idCardNumber}
          error={errors.idCardNumber}
          onChange={(e) => onChange({ idCardNumber: e.target.value })}
          required
        />
      </div>

      <div className={styles.grid2}>
        <Input
          label="Tên ngân hàng"
          value={form.bankName}
          error={errors.bankName}
          onChange={(e) => onChange({ bankName: e.target.value })}
          required
        />
        <Input
          label="Số tài khoản nhận tiền"
          value={form.bankAccountNumber}
          error={errors.bankAccountNumber}
          onChange={(e) => onChange({ bankAccountNumber: e.target.value })}
          required
        />
      </div>
      <Input
        label="Chủ tài khoản"
        value={form.bankAccountHolder}
        error={errors.bankAccountHolder}
        onChange={(e) => onChange({ bankAccountHolder: e.target.value })}
        required
      />

      <div className={styles.actionRow}>
        <Button variant="secondary" onClick={onBack}>
          Quay lại
        </Button>
        <Button variant="primary" onClick={onNext}>
          Tiếp tục: Cách bán &amp; Nguồn hàng
        </Button>
      </div>
    </div>
  );
}
