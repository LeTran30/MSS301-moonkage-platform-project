import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Icon } from '@/shared/ui';
import styles from './Header.module.css';

interface HeaderMobileNavProps {
  /** Tên tỉnh đang chọn — hiển thị trong drawer. */
  selectedProvince: string;
  /** Mở hộp chọn khu vực giao. */
  onOpenLocation: () => void;
}

/**
 * Menu di động của header (drawer trượt từ phải).
 *
 * Trên màn hình rộng menu nằm ngang trong `HeaderNav`; ở breakpoint `lg` trở
 * xuống, menu ngang bị ẩn và thay bằng nút hamburger mở drawer này.
 *
 * Drawer đóng bằng: nút X, bấm ra ngoài, phím Escape, hoặc bấm một mục
 * (điều hướng sang trang khác).
 */
export function HeaderMobileNav({ selectedProvince, onOpenLocation }: HeaderMobileNavProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Đóng drawer khi điều hướng sang trang khác.
  // Khoá cuộn trang + đóng bằng Escape khi drawer đang mở.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    // Đưa tiêu điểm vào drawer để người dùng bàn phím không bị mất ngữ cảnh.
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className={styles.mobileMenuBtn}
        aria-label="Mở menu điều hướng"
        aria-expanded={open}
        aria-controls="header-mobile-nav"
        onClick={() => setOpen(true)}
      >
        <Icon name="menu" size={20} />
      </button>

      {open && (
        <div className={styles.drawerOverlay} onClick={() => setOpen(false)}>
          <div
            id="header-mobile-nav"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu điều hướng"
            tabIndex={-1}
            className={styles.drawerPanel}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>Menu</span>
              <button
                type="button"
                className={styles.drawerClose}
                aria-label="Đóng menu"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <nav className={styles.drawerNav} aria-label="Điều hướng chính (di động)">
              <Link
                to={routes.base.home}
                className={styles.drawerItem}
                onClick={() => setOpen(false)}
              >
                <Icon name="home" size={18} /> Trang chủ
              </Link>
              <Link
                to={routes.base.catalog}
                className={styles.drawerItem}
                onClick={() => setOpen(false)}
              >
                <Icon name="store" size={18} /> Mua lẻ
              </Link>
              <Link
                to={routes.base.bulk}
                className={styles.drawerItem}
                onClick={() => setOpen(false)}
              >
                <Icon name="package" size={18} /> Đặt số lượng lớn
              </Link>
              <Link
                to={routes.base.quoteRequestNew}
                className={styles.drawerItem}
                onClick={() => setOpen(false)}
              >
                <Icon name="file" size={18} /> Tạo yêu cầu báo giá
              </Link>
              <Link
                to={routes.base.vendors}
                className={styles.drawerItem}
                onClick={() => setOpen(false)}
              >
                <Icon name="factory" size={18} /> Danh sách xưởng
              </Link>
              <Link
                to={routes.base.policy}
                className={styles.drawerItem}
                onClick={() => setOpen(false)}
              >
                <Icon name="layers" size={18} /> Chính sách sàn
              </Link>

              <button
                type="button"
                className={styles.drawerItem}
                onClick={() => {
                  setOpen(false);
                  onOpenLocation();
                }}
              >
                <Icon name="mapPin" size={18} /> Giao tới: <strong>{selectedProvince}</strong>
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
