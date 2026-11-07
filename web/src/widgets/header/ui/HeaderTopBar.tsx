import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Icon } from '@/shared/ui';
import type { User } from '@/entities/user';
import type { HeaderZone } from '../model/headerZone';
import styles from './Header.module.css';

interface HeaderTopBarProps {
  user: User;
  /** Đang khôi phục phiên: chưa biết người dùng có Shop hay không. */
  restoring?: boolean;
  zone: HeaderZone;
}

/**
 * Thanh trên cùng: lối sang kênh còn lại và các lối tắt (Ctrl+K, chính sách sàn).
 *
 * Ở kênh mua sắm: Kênh người bán khi đã có Shop, mở Shop khi chưa có. Ở Kênh người bán: về kênh mua sắm.
 */
export function HeaderTopBar({ user, restoring = false, zone }: HeaderTopBarProps) {
  return (
    <div className={styles.topBar}>
      <div className={styles.topInner}>
        <div className={styles.sellerEntry}>
          {zone === 'vendor' ? (
            <Link to={routes.base.home} className={styles.sellerLink}>
              <Icon name="arrowLeft" size={14} /> Về kênh mua sắm
            </Link>
          ) : restoring ? null : user.vendorId ? (
            <Link to={routes.vendor.overview} className={styles.sellerLink}>
              <Icon name="store" size={14} /> Kênh người bán của Shop bạn
            </Link>
          ) : (
            <Link to={routes.base.sellIntro} className={styles.sellerLink}>
              <Icon name="store" size={14} /> Đăng ký bán hàng trên Moonkage
            </Link>
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
