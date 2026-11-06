import { FEATURED_DELIVERY_PROVINCE_CODES, provinceNameOf } from '@/shared/config';
import { Modal, Icon } from '@/shared/ui';
import styles from './Header.module.css';

interface LocationPickerModalProps {
  open: boolean;
  /** Code of the current delivery province (`01` for Hà Nội). */
  selectedCode: string;
  onSelect: (provinceCode: string) => void;
  onClose: () => void;
}

/** Modal M1.1: chọn khu vực nhận hàng. */
export function LocationPickerModal({
  open,
  selectedCode,
  onSelect,
  onClose,
}: LocationPickerModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chọn khu vực nhận hàng"
      description="Moonkage lọc và ưu tiên các sản phẩm giao nhanh được tới địa phương của bạn."
    >
      <div className={styles.provinceGrid}>
        {FEATURED_DELIVERY_PROVINCE_CODES.map((code) => (
          <button
            key={code}
            type="button"
            className={`${styles.provinceCard} ${selectedCode === code ? styles.provinceSelected : ''}`}
            onClick={() => onSelect(code)}
          >
            <Icon name="mapPin" size={18} />
            <span>{provinceNameOf(code)}</span>
            {selectedCode === code && <Icon name="check" size={16} className={styles.checkIcon} />}
          </button>
        ))}
      </div>
    </Modal>
  );
}
