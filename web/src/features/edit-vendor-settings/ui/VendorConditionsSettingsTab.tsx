import { Button, Card, CardHeader, Input, Radio } from '@/shared/ui';
import styles from './vendorSettingsUi.module.css';

export type VendorSellingMode = 'BOTH' | 'READY_ONLY' | 'CUSTOM_ONLY';

interface VendorConditionsSettingsTabProps {
  sellingMode: VendorSellingMode;
  minBulkQuantity: string;
  minLeadTimeDays: string;
  onSellingModeChange: (value: VendorSellingMode) => void;
  onMinBulkQuantityChange: (value: string) => void;
  onMinLeadTimeDaysChange: (value: string) => void;
  onSave: (e: React.FormEvent) => void;
  busy?: boolean;
}

/** B6.3: điều kiện nhận đơn đặt hàng doanh nghiệp (BR-21, Flow 3). */
export function VendorConditionsSettingsTab({
  sellingMode,
  minBulkQuantity,
  minLeadTimeDays,
  onSellingModeChange,
  onMinBulkQuantityChange,
  onMinLeadTimeDaysChange,
  onSave,
  busy,
}: VendorConditionsSettingsTabProps) {
  return (
    <Card className={styles.formCard}>
      <CardHeader
        title="Điều kiện nhận đơn đặt hàng doanh nghiệp"
        description="Cấu hình chế độ hoạt động và chính sách cọc sản xuất"
      />

      <form onSubmit={onSave}>
        <div className={styles.formBody}>
          <div className={styles.formGroup}>
            <div className={styles.label} id="selling-mode-label">
              Chế độ hoạt động của gian hàng
            </div>
            <div className={styles.modeCards} role="radiogroup" aria-labelledby="selling-mode-label">
              <label
                className={`${styles.modeCard} ${sellingMode === 'BOTH' ? styles.modeActive : ''}`}
              >
                <Radio
                  name="sellingMode"
                  checked={sellingMode === 'BOTH'}
                  onChange={() => onSellingModeChange('BOTH')}
                  inputClassName={styles.modeRadio}
                  aria-label="Cả hai chế độ"
                />
                <div>
                  <strong>Cả hai chế độ (Mặc định)</strong>
                  <p>Vừa bán lẻ sản phẩm có sẵn trên sàn, vừa nhận sản xuất hộp quà số lượng lớn</p>
                </div>
              </label>

              <label
                className={`${styles.modeCard} ${sellingMode === 'READY_ONLY' ? styles.modeActive : ''}`}
              >
                <Radio
                  name="sellingMode"
                  checked={sellingMode === 'READY_ONLY'}
                  onChange={() => onSellingModeChange('READY_ONLY')}
                  inputClassName={styles.modeRadio}
                  aria-label="Chỉ bán lẻ (Có hàng sẵn)"
                />
                <div>
                  <strong>Chỉ bán lẻ (Có hàng sẵn)</strong>
                  <p>Chỉ trưng bày và bán các mẫu bánh có sẵn, không nhận thiết kế theo yêu cầu</p>
                </div>
              </label>

              <label
                className={`${styles.modeCard} ${sellingMode === 'CUSTOM_ONLY' ? styles.modeActive : ''}`}
              >
                <Radio
                  name="sellingMode"
                  checked={sellingMode === 'CUSTOM_ONLY'}
                  onChange={() => onSellingModeChange('CUSTOM_ONLY')}
                  inputClassName={styles.modeRadio}
                  aria-label="Chỉ nhận đặt hàng (Custom only)"
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
                  <label className={styles.label} htmlFor="vendor-moq">
                    Số lượng đặt tối thiểu (MOQ - bánh) *
                  </label>
                  <Input
                    id="vendor-moq"
                    type="number"
                    value={minBulkQuantity}
                    onChange={(e) => onMinBulkQuantityChange(e.target.value)}
                    placeholder="Ví dụ: 50"
                  />
                </div>
                <div className={styles.col}>
                  <label className={styles.label} htmlFor="vendor-lead-time">
                    Thời gian chuẩn bị tối thiểu (ngày) *
                  </label>
                  <Input
                    id="vendor-lead-time"
                    type="number"
                    value={minLeadTimeDays}
                    onChange={(e) => onMinLeadTimeDaysChange(e.target.value)}
                    placeholder="Ví dụ: 7"
                  />
                </div>
              </div>

              {/*
                Tỷ lệ đặt cọc và việc "xưởng có in logo riêng" trước đây có ô
                nhập, nhưng máy chủ không lưu chúng (`SaveOrderProfileRequest` không
                có `depositRate`), nên người dùng tưởng đã thiết lập trong khi
                thực ra không có gì được lưu. Tỷ lệ cọc thuộc về báo giá của từng
                lần báo giá, không thuộc hồ sơ gian hàng.
              */}
              <div className={styles.inputHint}>
                Tỷ lệ đặt cọc do xưởng quyết định trong từng báo giá gửi tới khách hàng, và
                được sàn ghi nhận khi khách chấp nhận báo giá.
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
