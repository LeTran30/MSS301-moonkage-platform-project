import { Button, Card, CardHeader, Input, Select } from '@/shared/ui';
import styles from './vendorSettingsUi.module.css';

interface VendorLegalSettingsTabProps {
  businessType: string;
  businessName: string;
  taxCode: string;
  representative: string;
  representativeCccd: string;
  address: string;
  onBusinessTypeChange: (value: string) => void;
  onBusinessNameChange: (value: string) => void;
  onTaxCodeChange: (value: string) => void;
  onRepresentativeChange: (value: string) => void;
  onAddressChange: (value: string) => void;
}

/** B6.1: thông tin pháp lý & hồ sơ người bán (BR-33). */
export function VendorLegalSettingsTab({
  businessType,
  businessName,
  taxCode,
  representative,
  representativeCccd,
  address,
  onBusinessTypeChange,
  onBusinessNameChange,
  onTaxCodeChange,
  onRepresentativeChange,
  onAddressChange,
}: VendorLegalSettingsTabProps) {
  return (
    <Card className={styles.formCard}>
      <CardHeader
        title="Thông tin pháp lý & Hồ sơ người bán (BR-33)"
        description="Quy định: Chỉ chấp nhận mô hình Hộ kinh doanh hoặc Doanh nghiệp tư nhân sản xuất thực phẩm"
      />

      <div className={styles.formBody}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Hình thức đăng ký kinh doanh (BR-33)</label>
          <Select
            value={businessType}
            onChange={(e) => onBusinessTypeChange(e.target.value)}
            options={[
              { value: 'HKD', label: 'Hộ kinh doanh cá thể (HKD)' },
              { value: 'DNTN', label: 'Doanh nghiệp tư nhân (DNTN)' },
            ]}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Tên cơ sở kinh doanh theo ĐKKD</label>
          <Input value={businessName} onChange={(e) => onBusinessNameChange(e.target.value)} />
        </div>

        <div className={styles.formRow}>
          <div className={styles.col}>
            <label className={styles.label}>Mã số thuế / Mã ĐKKD</label>
            <Input value={taxCode} onChange={(e) => onTaxCodeChange(e.target.value)} />
          </div>
          <div className={styles.col}>
            <label className={styles.label}>Người đại diện theo pháp luật</label>
            <Input
              value={representative}
              onChange={(e) => onRepresentativeChange(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.col}>
            <label className={styles.label}>Số CCCD gắn chip (Đã xác thực NFC)</label>
            <Input value={representativeCccd} disabled />
            <span className={styles.verifiedNotice}>🛡️ Đã đối chiếu thành công qua NFC V5</span>
          </div>
          <div className={styles.col}>
            <label className={styles.label}>Địa chỉ cơ sở sản xuất</label>
            <Input value={address} onChange={(e) => onAddressChange(e.target.value)} />
          </div>
        </div>

        <div className={styles.formActions}>
          <Button type="submit" variant="primary">
            Lưu thông tin pháp lý
          </Button>
        </div>
      </div>
    </Card>
  );
}
