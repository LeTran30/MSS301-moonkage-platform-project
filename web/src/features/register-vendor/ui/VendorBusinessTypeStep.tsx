import { routes } from '@/shared/config';
import { Button, ButtonLink, Icon } from '@/shared/ui';
import type { VendorType } from '@/entities/vendor';
import styles from './VendorBusinessTypeStep.module.css';

interface VendorBusinessTypeStepProps {
  value: VendorType;
  onChange: (value: VendorType) => void;
  onNext: () => void;
}

/**
 * Bước 1: chọn mô hình pháp lý (BR-33).
 *
 * Hộ kinh doanh cá thể (HKD) hoặc doanh nghiệp tư nhân (DNTN).
 *
 * Hai lựa chọn là một nhóm radio, nên chúng dùng `input[type=radio]` thật:
 * bàn phím điều hướng được bằng mũi tên, screen reader đọc đúng vai trò,
 * và trạng thái đã chọn do chính trình duyệt quản lý.
 */
export function VendorBusinessTypeStep({ value, onChange, onNext }: VendorBusinessTypeStepProps) {
  return (
    <div className={styles.stepContent}>
      <h3 id="business-type-label">Bước 1: Chọn mô hình pháp lý của bạn (BR-33)</h3>
      <div className={styles.typeCards} role="radiogroup" aria-labelledby="business-type-label">
        <label
          className={`${styles.typeCard} ${value === 'HKD' ? styles.typeSelected : ''}`}
        >
          <input
            type="radio"
            name="business-type"
            value="HKD"
            checked={value === 'HKD'}
            onChange={() => onChange('HKD')}
            className={styles.typeRadio}
          />
          <Icon name="store" size={28} />
          <div>
            <strong>Hộ Kinh Doanh (HKD)</strong>
            <p>
              Phù hợp cho các tiệm bánh gia đình, cơ sở sản xuất thủ công nhỏ lẻ đã được cấp giấy
              chứng nhận ĐKKD.
            </p>
          </div>
          {value === 'HKD' && <Icon name="check" size={18} className={styles.checkIcon} />}
        </label>

        <label
          className={`${styles.typeCard} ${value === 'DNTN' ? styles.typeSelected : ''}`}
        >
          <input
            type="radio"
            name="business-type"
            value="DNTN"
            checked={value === 'DNTN'}
            onChange={() => onChange('DNTN')}
            className={styles.typeRadio}
          />
          <Icon name="building" size={28} />
          <div>
            <strong>Doanh Nghiệp Tư Nhân (DNTN)</strong>
            <p>
              Phù hợp cho các xưởng bánh có tư cách pháp nhân riêng do một cá nhân làm chủ sở hữu.
            </p>
          </div>
          {value === 'DNTN' && <Icon name="check" size={18} className={styles.checkIcon} />}
        </label>
      </div>

      <div className={styles.actionRow}>
        <ButtonLink to={routes.base.sellIntro} variant="secondary">
          Quay lại
        </ButtonLink>
        <Button variant="primary" onClick={onNext}>
          Tiếp tục: Thông tin đơn vị
        </Button>
      </div>
    </div>
  );
}
