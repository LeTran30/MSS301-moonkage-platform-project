import { Button, Icon, Input } from '@/shared/ui';
import type { SellingMode } from '@/entities/vendor';
import type { VendorRegistrationForm, VendorSourceType } from '../model/vendorRegistrationForm';
import styles from './VendorSellingModeStep.module.css';

interface VendorSellingModeStepProps {
  form: VendorRegistrationForm;
  onChange: (patch: Partial<VendorRegistrationForm>) => void;
  onBack: () => void;
  onNext: () => void;
}

const SOURCE_OPTIONS: VendorSourceType[] = ['Tự sản xuất', 'Bán lại', 'Cả hai'];

/** Bước 3: nguồn hàng, cách thức bán và tài liệu pháp lý (BR-21, FR-26). */
export function VendorSellingModeStep({
  form,
  onChange,
  onBack,
  onNext,
}: VendorSellingModeStepProps) {
  return (
    <div className={styles.stepContent}>
      <h3>Bước 3: Nguồn hàng &amp; Cách thức bán hàng trên sàn</h3>

      <div className={styles.field}>
        <label className={styles.label}>Nguồn gốc bánh cung cấp:</label>
        <div className={styles.optionRow}>
          {SOURCE_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className={`${styles.radioPill} ${form.sourceType === s ? styles.radioSelected : ''}`}
              onClick={() => onChange({ sourceType: s })}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Hình thức bán hàng trên Moonkage (BR-21):</label>
        <div className={styles.optionRow}>
          <button
            type="button"
            className={`${styles.radioPill} ${form.sellingMode === 'BOTH' ? styles.radioSelected : ''}`}
            onClick={() => onChange({ sellingMode: 'BOTH' as SellingMode })}
          >
            Có hàng sẵn bán lẻ &amp; Nhận đơn đặt sỉ
          </button>
          <button
            type="button"
            className={`${styles.radioPill} ${form.sellingMode === 'CUSTOM_ORDER' ? styles.radioSelected : ''}`}
            onClick={() => onChange({ sellingMode: 'CUSTOM_ORDER' })}
          >
            Chỉ nhận đơn đặt hàng số lượng lớn (Xưởng)
          </button>
          <button
            type="button"
            className={`${styles.radioPill} ${form.sellingMode === 'RETAIL_SHOP' ? styles.radioSelected : ''}`}
            onClick={() => onChange({ sellingMode: 'RETAIL_SHOP' })}
          >
            Chỉ bán lẻ sản phẩm có sẵn tại Shop
          </button>
        </div>
      </div>

      <div className={styles.feeNotice}>
        <Icon name="sparkle" size={16} />
        <span>
          <strong>Lưu ý phí mở bán (FR-27, FR-53):</strong> Sau khi hồ sơ được Đội vận hành kiểm
          duyệt thông qua, bạn sẽ thanh toán phí mở bán 200.000đ (thanh toán 1 lần qua VNPay) để
          chính thức kích hoạt gian hàng.
        </span>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="business-license-key">
          Mã tệp Giấy phép kinh doanh (objectKey sau khi tải lên)
        </label>
        <Input
          id="business-license-key"
          value={form.businessLicenseKey}
          onChange={(e) => onChange({ businessLicenseKey: e.target.value })}
          placeholder="VD: vendors/abc/business-license.pdf"
          hint="Tải lên trước qua POST /api/vendors/uploads rồi dán tempKey vào đây"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="food-safety-key">
          Mã tệp Giấy chứng nhận An toàn thực phẩm (objectKey)
        </label>
        <Input
          id="food-safety-key"
          value={form.foodSafetyKey}
          onChange={(e) => onChange({ foodSafetyKey: e.target.value })}
          placeholder="VD: vendors/abc/food-safety.jpg"
        />
      </div>

      <div className={styles.actionRow}>
        <Button variant="secondary" onClick={onBack}>
          Quay lại
        </Button>
        <Button variant="primary" onClick={onNext}>
          Tiếp tục: Xem lại hồ sơ
        </Button>
      </div>
    </div>
  );
}
