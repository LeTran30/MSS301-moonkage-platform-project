import { PROVINCE_ITEMS } from '@/shared/config';
import { Input, Select } from '@/shared/ui';
import styles from './vendorSettingsUi.module.css';

interface LegalIdentityFieldsProps {
  businessName: string;
  onBusinessNameChange: (value: string) => void;
  taxCode: string;
  onTaxCodeChange: (value: string) => void;
  entityType: 'HOUSEHOLD_BUSINESS' | 'SOLE_PROPRIETORSHIP';
  onEntityTypeChange: (value: 'HOUSEHOLD_BUSINESS' | 'SOLE_PROPRIETORSHIP') => void;
  address: string;
  onAddressChange: (value: string) => void;
  provinceCode: string;
  onProvinceCodeChange: (value: string) => void;
  representativeName: string;
  onRepresentativeNameChange: (value: string) => void;
  /** Số CCCD đầy đủ: máy chủ chỉ trả bản đã che, nên người bán nhập lại mỗi lần nộp. */
  representativeIdNumber: string;
  onRepresentativeIdNumberChange: (value: string) => void;
  supplySource: 'SELF_PRODUCED' | 'RESELL' | 'BOTH';
  onSupplySourceChange: (value: 'SELF_PRODUCED' | 'RESELL' | 'BOTH') => void;
}

/**
 * The identity part of the legal profile (FR-26, BR-33).
 *
 * `entityType` only accepts a household business or a sole proprietorship: a
 * company is refused by the backend.
 */
export function LegalIdentityFields({
  businessName,
  onBusinessNameChange,
  taxCode,
  onTaxCodeChange,
  entityType,
  onEntityTypeChange,
  address,
  onAddressChange,
  provinceCode,
  onProvinceCodeChange,
  representativeName,
  onRepresentativeNameChange,
  representativeIdNumber,
  onRepresentativeIdNumberChange,
  supplySource,
  onSupplySourceChange,
}: LegalIdentityFieldsProps) {
  return (
    <>
      <div>
        <label className={styles.label} htmlFor="legal-business-name">
          Tên pháp nhân / Hộ kinh doanh đăng ký *
        </label>
        <Input
          id="legal-business-name"
          type="text"
          placeholder="Ví dụ: Công ty TNHH Bánh Hương Việt"
          value={businessName}
          onChange={(e) => onBusinessNameChange(e.target.value)}
          required
        />
      </div>

      <div className={styles.gridTwo}>
        <div>
          <label className={styles.label} htmlFor="legal-tax-code">
            Mã số thuế / Số ĐKKD *
          </label>
          <Input
            id="legal-tax-code"
            type="text"
            placeholder="Ví dụ: 0312345678"
            value={taxCode}
            onChange={(e) => onTaxCodeChange(e.target.value)}
            required
          />
        </div>
        <div>
          <Select
            label="Loại hình pháp lý"
            required
            options={[
              { value: 'HOUSEHOLD_BUSINESS', label: 'Hộ kinh doanh' },
              { value: 'SOLE_PROPRIETORSHIP', label: 'Doanh nghiệp tư nhân' },
            ]}
            value={entityType}
            onChange={(v) =>
              onEntityTypeChange(v as 'HOUSEHOLD_BUSINESS' | 'SOLE_PROPRIETORSHIP')
            }
          />
        </div>
      </div>

      <div className={styles.gridTwo}>
        <div>
          <label className={styles.label} htmlFor="legal-address">
            Địa chỉ trụ sở / Xưởng sản xuất *
          </label>
          <Input
            id="legal-address"
            type="text"
            placeholder="Ví dụ: 88 Đường Nguyễn Đình Chiểu, Quận 1, TP Hồ Chí Minh"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            required
          />
        </div>
        <div>
          <Select
            label="Tỉnh / Thành phố trụ sở"
            required
            options={PROVINCE_ITEMS.map((p) => ({ value: p.code, label: p.name }))}
            value={provinceCode}
            onChange={onProvinceCodeChange}
          />
        </div>
      </div>

      <div className={styles.gridTwo}>
        <div>
          <label className={styles.label} htmlFor="legal-representative">
            Người đại diện pháp luật *
          </label>
          <Input
            id="legal-representative"
            type="text"
            placeholder="Ví dụ: NGUYEN THI MAI"
            value={representativeName}
            onChange={(e) => onRepresentativeNameChange(e.target.value)}
            hint="Viết không dấu, đúng như trên CCCD"
            required
          />
        </div>
        <div>
          <label className={styles.label} htmlFor="legal-representative-id">
            Số CCCD của người đại diện *
          </label>
          <Input
            id="legal-representative-id"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={representativeIdNumber}
            onChange={(e) => onRepresentativeIdNumberChange(e.target.value)}
            hint="Đủ 12 số, trùng với CCCD đã xác minh NFC"
            required
          />
        </div>
      </div>

      <div className={styles.gridTwo}>
        <div>
          <Select
            label="Nguồn hàng"
            required
            options={[
              { value: 'SELF_PRODUCED', label: 'Tự sản xuất' },
              { value: 'RESELL', label: 'Bán lại' },
              { value: 'BOTH', label: 'Cả hai' },
            ]}
            value={supplySource}
            onChange={(v) => onSupplySourceChange(v as 'SELF_PRODUCED' | 'RESELL' | 'BOTH')}
          />
        </div>
      </div>
    </>
  );
}
