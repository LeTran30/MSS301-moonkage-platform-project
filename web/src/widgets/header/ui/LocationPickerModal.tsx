import { Modal, Icon } from '@/shared/ui';
import styles from './Header.module.css';

const PROVINCES = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Bắc Ninh',
  'Hưng Yên',
  'Cần Thơ',
  'Bình Dương',
  'Đồng Nai',
];

interface LocationPickerModalProps {
  open: boolean;
  selectedProvince: string;
  onSelect: (province: string) => void;
  onClose: () => void;
}

/** Modal M1.1: chọn khu vực nhận hàng. */
export function LocationPickerModal({
  open,
  selectedProvince,
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
        {PROVINCES.map((p) => (
          <button
            key={p}
            type="button"
            className={`${styles.provinceCard} ${selectedProvince === p ? styles.provinceSelected : ''}`}
            onClick={() => onSelect(p)}
          >
            <Icon name="mapPin" size={18} />
            <span>{p}</span>
            {selectedProvince === p && <Icon name="check" size={16} className={styles.checkIcon} />}
          </button>
        ))}
      </div>
    </Modal>
  );
}
