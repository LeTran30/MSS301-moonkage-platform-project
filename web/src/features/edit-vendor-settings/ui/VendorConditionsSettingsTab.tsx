import { Button, Card, CardHeader, Input } from '@/shared/ui';
import styles from './vendorSettingsUi.module.css';

export type VendorSellingMode = 'BOTH' | 'READY_ONLY' | 'CUSTOM_ONLY';

interface VendorConditionsSettingsTabProps {
  sellingMode: VendorSellingMode;
  minBulkQuantity: string;
  minLeadTimeDays: string;
  defaultDepositPercent: string;
  customBoxService: boolean;
  onSellingModeChange: (value: VendorSellingMode) => void;
  onMinBulkQuantityChange: (value: string) => void;
  onMinLeadTimeDaysChange: (value: string) => void;
  onDefaultDepositPercentChange: (value: string) => void;
  onCustomBoxServiceChange: (value: boolean) => void;
  onSave: (e: React.FormEvent) => void;
  busy?: boolean;
}

/** B6.3: điều kiện nhận đơn đặt hàng doanh nghiệp (BR-21, Flow 3). */
export function VendorConditionsSettingsTab({
  sellingMode,
  minBulkQuantity,
  minLeadTimeDays,
  defaultDepositPercent,
  customBoxService,
  onSellingModeChange,
  onMinBulkQuantityChange,
  onMinLeadTimeDaysChange,
  onDefaultDepositPercentChange,
  onCustomBoxServiceChange,
  onSave,
  busy,
}: VendorConditionsSettingsTabProps) {
  return (
    <Card className={styles.formCard}>
      <CardHeader
        title="Điều kiện nhận đơn đặt hàng doanh nghiệp (B6.3, BR-21)"
        description="Cấu hình chế độ hoạt động và chính sách cọc sản xuất"
      />

      <form onSubmit={onSave}>
        <div className={styles.formBody}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Chế độ hoạt động của gian hàng (BR-21)</label>
          <div className={styles.modeCards}>
            <label className={`${styles.modeCard} ${sellingMode === 'BOTH' ? styles.modeActive : ''}`}>
              <input
                type="radio"
                name="sellingMode"
                checked={sellingMode === 'BOTH'}
                onChange={() => onSellingModeChange('BOTH')}
              />
              <div>
                <strong>Cả hai chế độ (Mặc định)</strong>
                <p>Vừa bán lẻ sản phẩm có sẵn trên sàn, vừa nhận sản xuất hộp quà số lượng lớn</p>
              </div>
            </label>

            <label className={`${styles.modeCard} ${sellingMode === 'READY_ONLY' ? styles.modeActive : ''}`}>
              <input
                type="radio"
                name="sellingMode"
                checked={sellingMode === 'READY_ONLY'}
                onChange={() => onSellingModeChange('READY_ONLY')}
              />
              <div>
                <strong>Chỉ bán lẻ (Có hàng sẵn)</strong>
                <p>Chỉ trưng bày và bán các mẫu bánh có sẵn, không nhận thiết kế theo yêu cầu</p>
              </div>
            </label>

            <label className={`${styles.modeCard} ${sellingMode === 'CUSTOM_ONLY' ? styles.modeActive : ''}`}>
              <input
                type="radio"
                name="sellingMode"
                checked={sellingMode === 'CUSTOM_ONLY'}
                onChange={() => onSellingModeChange('CUSTOM_ONLY')}
              />
              <div>
                <strong>Chỉ nhận đặt hàng (Custom only)</strong>
                <p>Chuyên gia công số lượng lớn theo hợp đồng cho doanh nghiệp, xí nghiệp</p>
              </div>
            </label>
          </div>
        </div>

        {sellingMode !== 'READY_ONLY' && (
          <>
            <div className={styles.formRow}>
              <div className={styles.col}>
                <label className={styles.label}>Số lượng đặt tối thiểu (MOQ - bánh) *</label>
                <Input
                  type="number"
                  value={minBulkQuantity}
                  onChange={(e) => onMinBulkQuantityChange(e.target.value)}
                  placeholder="50"
                />
              </div>
              <div className={styles.col}>
                <label className={styles.label}>Thời gian chuẩn bị tối thiểu (ngày) *</label>
                <Input
                  type="number"
                  value={minLeadTimeDays}
                  onChange={(e) => onMinLeadTimeDaysChange(e.target.value)}
                  placeholder="7"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tỷ lệ đặt cọc mặc định đề xuất (%) *</label>
              <Input
                type="number"
                value={defaultDepositPercent}
                onChange={(e) => onDefaultDepositPercentChange(e.target.value)}
                placeholder="40"
              />
              <span className={styles.inputHint}>
                Khách hàng sẽ cọc tỷ lệ này để xưởng tiến hành làm Maket và chuẩn bị khuôn bánh
              </span>
            </div>

            <div className={styles.checkboxRow}>
              <input
                type="checkbox"
                id="customBox"
                checked={customBoxService}
                onChange={(e) => onCustomBoxServiceChange(e.target.checked)}
              />
              <label htmlFor="customBox">
                Xưởng có hỗ trợ thiết kế Maket và in dập logo doanh nghiệp riêng lên hộp quà
              </label>
            </div>
          </>
        )}

        <div className={styles.formActions}>
          <Button type="submit" variant="primary" loading={busy}>
            Lưu điều kiện nhận đơn
          </Button>
        </div>
        </div>
      </form>
    </Card>
  );
}
