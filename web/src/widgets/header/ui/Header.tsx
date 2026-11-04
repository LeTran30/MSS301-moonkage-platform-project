import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Icon, toast } from '@/shared/ui';
import { CartBadge } from '@/entities/cart';
import { useTheme } from '@/shared/lib/theme';
import { switchDemoActor, useCurrentUser } from '@/entities/user';
import { ActorSwitcherModal } from './ActorSwitcherModal';
import { HeaderNav } from './HeaderNav';
import { HeaderNotifications } from './HeaderNotifications';
import { HeaderSearch } from './HeaderSearch';
import { HeaderTopBar } from './HeaderTopBar';
import { HeaderUserMenu } from './HeaderUserMenu';
import { LocationPickerModal } from './LocationPickerModal';
import styles from './Header.module.css';

export function Header() {
  const user = useCurrentUser();
  const [theme, toggleTheme] = useTheme();
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState('Hà Nội');
  const [actorSwitcherOpen, setActorSwitcherOpen] = useState(false);

  return (
    <header className={styles.header}>
      <HeaderTopBar user={user} onOpenActorSwitcher={() => setActorSwitcherOpen(true)} />

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
            selectedProvince={selectedProvince}
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
                    : 'Đã bật chế độ Đêm Hội Trăng Rằm'
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

            <HeaderUserMenu user={user} />
          </div>
        </div>
      </div>

      <LocationPickerModal
        open={locationModalOpen}
        selectedProvince={selectedProvince}
        onSelect={(province) => {
          setSelectedProvince(province);
          setLocationModalOpen(false);
        }}
        onClose={() => setLocationModalOpen(false)}
      />

      <ActorSwitcherModal
        open={actorSwitcherOpen}
        currentUserId={user.id}
        onSelect={(key) => {
          switchDemoActor(key);
          setActorSwitcherOpen(false);
        }}
        onClose={() => setActorSwitcherOpen(false)}
      />
    </header>
  );
}
