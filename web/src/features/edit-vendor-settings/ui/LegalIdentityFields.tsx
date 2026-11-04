import { Input } from '@/shared/ui';
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
  supplySource,
  onSupplySourceChange,
}: LegalIdentityFieldsProps) {
  return (
    <>
      <div>
        <label className={styles.label}>Tên pháp nhân / Hộ kinh doanh đăng ký *</label>
        <Input
          type="text"
          value={businessName}
          onChange={(e) => onBusinessNameChange(e.target.value)}
          required
        />
      </div>

      <div className={styles.gridTwo}>
        <div>
          <label className={styles.label}>Mã số thuế / Số ĐKKD *</label>
          <Input type="text" value={taxCode} onChange={(e) => onTaxCodeChange(e.target.value)} required />
        </div>
        <div>
          <label className={styles.label}>Loại hình pháp lý *</label>
          <select
            className={styles.select}
            value={entityType}
            onChange={(e) =>
              onEntityTypeChange(e.target.value as 'HOUSEHOLD_BUSINESS' | 'SOLE_PROPRIETORSHIP')
            }
          >
            <option value="HOUSEHOLD_BUSINESS">Hộ kinh doanh</option>
            <option value="SOLE_PROPRIETORSHIP">Doanh nghiệp tư nhân</option>
          </select>
        </div>
      </div>

      <div className={styles.gridTwo}>
        <div>
          <label className={styles.label}>Địa chỉ trụ sở / Xưởng sản xuất *</label>
          <Input type="text" value={address} onChange={(e) => onAddressChange(e.target.value)} required />
        </div>
        <div>
          <label className={styles.label}>Mã tỉnh / thành phố *</label>
          <Input
            type="text"
            value={provinceCode}
            onChange={(e) => onProvinceCodeChange(e.target.value)}
            placeholder="VD: 01"
            required
          />
        </div>
      </div>

      <div className={styles.gridTwo}>
        <div>
          <label className={styles.label}>Người đại diện pháp luật *</label>
          <Input
            type="text"
            value={representativeName}
            onChange={(e) => onRepresentativeNameChange(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={styles.label}>Nguồn hàng *</label>
          <select
            className={styles.select}
            value={supplySource}
            onChange={(e) => onSupplySourceChange(e.target.value as 'SELF_PRODUCED' | 'RESELL' | 'BOTH')}
          >
            <option value="SELF_PRODUCED">Tự sản xuất</option>
            <option value="RESELL">Bán lại</option>
            <option value="BOTH">Cả hai</option>
          </select>
        </div>
      </div>
    </>
  );
}
