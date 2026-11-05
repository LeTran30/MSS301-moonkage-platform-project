import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/shared/ui';
import styles from './SidebarDrawer.module.css';

type SidebarDrawerProps = {
  /**
   * Nội dung menu. Nhận hàm `onNavigate` để đóng drawer khi người dùng chọn
   * một mục (điều hướng sang trang khác).
   */
  children: (onNavigate: () => void) => ReactNode;
  /** Nhãn của drawer, dùng cho `aria-label` và tiêu đề hiển thị. */
  title: string;
  /** `id` của panel, dùng cho `aria-controls`. */
  panelId: string;
  /** Bên nào drawer trượt vào: `left` (sidebar) hoặc `right`. */
  side?: 'left' | 'right';
  /** Khu vực màu — để drawer giữ đúng accent của kênh đang xem. */
  zone?: 'base' | 'vendor' | 'admin';
};

/**
 * Drawer cho sidebar trên màn hình hẹp (audit §3.3).
 *
 * Ở breakpoint `lg` trở xuống, sidebar dạng cột cố định chiến 248–260px — trên
 * điện thoại chỉ còn ~150px cho nội dung nên không dùng được. Drawer này
 * thay thế sidebar bằng một panel trượt vào, theo đúng pattern của
 * `HeaderMobileNav`.
 *
 * Drawer đóng bằng: nút X, bấm ra ngoài, phím Escape, hoặc bấm một mục
 * (điều hướng sang trang khác). Khi mở: khoá cuộn trang, đưa tiêu điểm vào
 * panel; khi đóng: trả tiêu điểm về nút đã mở.
 *
 * Panel được render qua `createPortal` vào `document.body` để không bị ảnh
 * hưởng bởi `overflow`/`transform` của vùng chứa nên vẫn trượt đúng từ mép
 * màn hình.
 */
export function SidebarDrawer({
  children,
  title,
  panelId,
  side = 'left',
  zone,
}: SidebarDrawerProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className={styles.trigger}
        aria-label={`Mở menu ${title.toLowerCase()}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
      >
        <Icon name="menu" size={20} />
      </button>

      {open &&
        createPortal(
          <div
            className={styles.overlay}
            data-side={side}
            data-zone={zone}
            onClick={close}
            role="presentation"
          >
            <div
              id={panelId}
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              tabIndex={-1}
              className={styles.panel}
              data-side={side}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.panelHeader}>
                <span className={styles.panelTitle}>{title}</span>
                <button
                  type="button"
                  className={styles.closeBtn}
                  aria-label={`Đóng menu ${title.toLowerCase()}`}
                  onClick={close}
                >
                  <Icon name="x" size={18} />
                </button>
              </div>

              <div className={styles.panelBody}>{children(close)}</div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
