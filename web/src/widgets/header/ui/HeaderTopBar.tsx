import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Badge, Icon } from '@/shared/ui';
import type { User } from '@/entities/user';
import styles from './Header.module.css';

interface HeaderTopBarProps {
  user: User;
}

/** Thanh trên cùng: thông tin tài khoản đang đăng nhập + lối tắt (Ctrl+K, chính sách). */
export function HeaderTopBar({ user }: HeaderTopBarProps) {
  const roleLabel =
    user.role === 'VENDOR' ? 'Người bán' : user.role === 'ADMIN' ? 'Quản trị' : 'Người mua';

  return (
    <div className={styles.topBar}>
      <div className={styles.topInner}>
        <div className={styles.actorIndicator}>
          <span className={styles.sparkleIcon}>
            <Icon name="sparkle" size={13} />
          </span>
          <span>
            Đang đăng nhập: <strong>{user.name}</strong> ({roleLabel})
          </span>
          {user.nfcStatus === 'VERIFIED' ? (
            <Badge tone="green" size="sm">
              <Icon name="shield" size={11} /> Đã xác minh NFC
            </Badge>
          ) : (
            <Badge tone="amber" size="sm">
              Chưa NFC
            </Badge>
          )}
        </div>

        <div className={styles.topLinks}>
          <button
            type="button"
            className={styles.cmdKBtn}
            onClick={() => {
              window.dispatchEvent(
                new KeyboardEvent('keydown', {
                  key: 'k',
                  ctrlKey: true,
                  bubbles: true,
                }),
              );
            }}
            title="Tìm kiếm nhanh & Lệnh (Ctrl+K)"
          >
            <Icon name="search" size={13} />
            <span>Tìm kiếm & Lệnh</span>
            <kbd className={styles.cmdKShortcut}>⌘K</kbd>
          </button>
          <span className={styles.divider}>|</span>
          <Link to={routes.base.policy} className={styles.sitemapLink}>
            <Icon name="layers" size={14} /> Chính sách sàn
          </Link>
        </div>
      </div>
    </div>
  );
}
