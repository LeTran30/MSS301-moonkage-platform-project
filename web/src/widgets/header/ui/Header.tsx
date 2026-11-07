import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Icon, toast } from '@/shared/ui';
import { CartBadge } from '@/entities/cart';
import {
  setDeliveryProvince,
  useDeliveryProvinceCode,
  useDeliveryProvinceName,
} from '@/entities/region';
import { useTheme } from '@/shared/lib/theme';
import { useCurrentUser, useIsRestoringSession } from '@/entities/user';
import { HeaderNav } from './HeaderNav';
import { HeaderNotifications } from './HeaderNotifications';
import { HeaderSearch } from './HeaderSearch';
import { HeaderTopBar } from './HeaderTopBar';
import { HeaderUserMenu } from './HeaderUserMenu';
import { HeaderMobileNav } from './HeaderMobileNav';
import { LocationPickerModal } from './LocationPickerModal';
import styles from './Header.module.css';

export function Header() {
  const user = useCurrentUser();
  // Có token nhưng chưa nạp xong hồ sơ: chưa biết là ai, không hiện "Khách"
  const restoring = useIsRestoringSession();
  const [theme, toggleTheme] = useTheme();
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  // The catalog, the cart and checkout read the same store (FR-06, BR-30).
  const provinceCode = useDeliveryProvinceCode();
  const provinceName = useDeliveryProvinceName();

  return (
    <header className={styles.header}>
      {/*
        Thanh trên cùng là dấu hiệu của bản dựng: nó lặp lại tên/role/NFC đã
        hiện ở menu tài khoản và nhắc phím tắt Ctrl+K. Ở production không cần,
        nên bản build production không render thanh này.
      */}
      {!import.meta.env.PROD && <HeaderTopBar user={user} restoring={restoring} />}

      {/* Main Header Row */}
      <div className={styles.mainRow}>
        <div className={styles.mainInner}>
          {/* Logo Moonkage */}
          <Link to={routes.base.home} className={styles.logo}>
            <span className={styles.logoEmblem}>
              <Icon name="lantern" size={26} />
            </span>
            <div className={styles.logoText}>
              <span className={styles.brandName}>Moonkage</span>
              <span className={styles.brandTagline}>Sàn Bánh Trung Thu</span>
            </div>
          </Link>

          <HeaderSearch />

          <HeaderNav
            selectedProvince={provinceName}
            onOpenLocation={() => setLocationModalOpen(true)}
          />

          <div className={styles.actionGroup}>
            <HeaderNotifications />

            {/* Theme Toggle (Trăng Rằm / Đêm Hội) */}
            <button
              type="button"
              className={styles.themeToggleBtn}
              onClick={() => {
                toggleTheme();
                toast.info(
                  theme === 'dark'
                    ? 'Đã bật chế độ Sáng Trăng Rằm'
                    : 'Đã bật chế độ Đêm Hội Trăng Rằm',
                );
              }}
              title={
                theme === 'dark'
                  ? 'Chuyển sang chế độ Sáng Trăng Rằm'
                  : 'Chuyển sang chế độ Đêm Hội Trăng Rằm'
              }
              aria-label="Đổi giao diện sáng tối"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>

            <CartBadge />

            <HeaderUserMenu user={user} restoring={restoring} />
          </div>

          <HeaderMobileNav
            selectedProvince={provinceName}
            onOpenLocation={() => setLocationModalOpen(true)}
          />
        </div>
      </div>

      <LocationPickerModal
        open={locationModalOpen}
        selectedCode={provinceCode}
        onSelect={(code) => {
          setDeliveryProvince(code);
          setLocationModalOpen(false);
        }}
        onClose={() => setLocationModalOpen(false)}
      />
    </header>
  );
}
