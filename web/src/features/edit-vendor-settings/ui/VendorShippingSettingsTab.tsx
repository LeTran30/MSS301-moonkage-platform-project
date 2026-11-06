import { Button, Card, CardHeader } from '@/shared/ui';
import { PROVINCE_ITEMS } from '@/shared/config';
import styles from './vendorSettingsUi.module.css';

interface VendorShippingSettingsTabProps {
  /** The provinces the shop delivers to, as 2-digit national codes (FR-28). */
  provinceCodes: string[];
  onProvinceToggle: (code: string) => void;
  onSave: (e: React.FormEvent) => void;
  busy?: boolean;
}

/**
 * B6.2: vùng giao hàng của gian hàng (FR-28, AC-28.1).
 *
 * The backend replaces the whole list of provinces
 * (`PUT /api/vendors/{vendorId}/delivery-areas`), so the tab shows the
 * provinces of the national list and sends the ones the seller ticked.
 */
export function VendorShippingSettingsTab({
  provinceCodes,
  onProvinceToggle,
  onSave,
  busy,
}: VendorShippingSettingsTabProps) {
  return (
    <Card className={styles.formCard}>
      <CardHeader
        title="Cấu hình phạm vi giao hàng & Phí ship (B6.2)"
        description="Tích hợp biểu phí giao hàng liên tỉnh theo quy định của Admin sàn Moonkage"
      />

      <form onSubmit={onSave}>
        <div className={styles.formBody}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Tỉnh / Thành phố giao được (FR-28)</label>
            <div className={styles.provinceGrid}>
              {PROVINCE_ITEMS.map((province) => {
                const checked = provinceCodes.includes(province.code);
                return (
                  <label key={province.code} className={styles.provinceItem}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onProvinceToggle(province.code)}
                    />
                    <span>
                      {province.name} <code>({province.code})</code>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className={styles.formActions}>
            <Button type="submit" variant="primary" loading={busy}>
              Lưu cấu hình giao hàng
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
