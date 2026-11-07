import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Badge, Icon } from '@/shared/ui';
import type { User } from '@/entities/user';
import styles from './Header.module.css';

interface HeaderTopBarProps {
  user: User;
  /** Đang khôi phục phiên: chưa biết người dùng là ai. */
  restoring?: boolean;
}

/** Thanh trên cùng: thông tin tài khoản đang đăng nhập + lối tắt (Ctrl+K, chính sách). */
export function HeaderTopBar({ user, restoring = false }: HeaderTopBarProps) {
  const guest = user.role === 'GUEST';
  // A member who owns a Shop both buys and sells; on screen they are first the Shop's owner.
  const roleLabel =
    user.role === 'ADMIN'
      ? 'Quản trị'
      : user.role === 'VENDOR' || user.vendorId
        ? 'Chủ Shop'
        : 'Người mua';

  return (
    <div className={styles.topBar}>
      <div className={styles.topInner}>
        <div className={styles.actorIndicator}>
          <span className={styles.sparkleIcon}>
            <Icon name="sparkle" size={13} />
          </span>
          {restoring ? (
            <span>Đang khôi phục phiên đăng nhập…</span>
          ) : guest ? (
            <span>Chưa đăng nhập</span>
          ) : (
            <span>
              Đang đăng nhập: <strong>{user.name}</strong> ({roleLabel})
            </span>
          )}
          {restoring || guest ? null : user.nfcStatus === 'VERIFIED' ? (
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
