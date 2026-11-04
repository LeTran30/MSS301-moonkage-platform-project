import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Icon } from '@/shared/ui';
import styles from './Header.module.css';

interface HeaderNavProps {
  selectedProvince: string;
  onOpenLocation: () => void;
}

/** Menu điều hướng chính + nút chọn khu vực giao (M1.0, M1.1). */
export function HeaderNav({ selectedProvince, onOpenLocation }: HeaderNavProps) {
  return (
    <nav className={styles.navMenu} aria-label="Điều hướng chính">
      <Link to={routes.base.catalog} className={styles.navItem}>
        Mua lẻ
      </Link>
      <div className={styles.dropdownWrap}>
        <Link to={routes.base.bulk} className={styles.navItem}>
          Đặt số lượng lớn <Icon name="chevronDown" size={14} />
        </Link>
        <div className={styles.dropdownMenu}>
          <Link to={routes.base.quoteRequestNew} className={styles.dropdownItem}>
            <Icon name="sparkle" size={16} /> Tạo yêu cầu báo giá (gửi nhiều nơi)
          </Link>
          <Link to={routes.base.vendors} className={styles.dropdownItem}>
            <Icon name="factory" size={16} /> Danh sách xưởng &amp; đơn vị cung cấp
          </Link>
        </div>
      </div>

      <button
        type="button"
        className={styles.locationBtn}
        onClick={onOpenLocation}
        title="Khu vực nhận hàng"
      >
        <Icon name="mapPin" size={15} />
        <span className={styles.locText}>
          Giao tới: <strong>{selectedProvince}</strong>
        </span>
        <Icon name="chevronDown" size={12} />
      </button>
    </nav>
  );
}
