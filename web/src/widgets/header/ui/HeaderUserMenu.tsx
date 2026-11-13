import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { ButtonLink, Icon } from '@/shared/ui';
import { sessionApi, type User } from '@/entities/user';
import styles from './Header.module.css';

interface HeaderUserMenuProps {
  user: User;
  /** Đang khôi phục phiên: chưa biết người dùng là ai. */
  restoring?: boolean;
}

/**
 * Menu tài khoản của người dùng (theo bảng nhãn IA).
 *
 * Menu là một `role="menu"` với các mục là `role="menuitem"`. Khi mở, tiêu điểm
 * chuyển vào menu để người dùng bàn phím điều hướng được bằng mũi tên; Esc
 * đóng menu và trả tiêu điểm về nút đã mở nó.
 */
export function HeaderUserMenu({ user, restoring = false }: HeaderUserMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Đóng menu khi bấm ra ngoài, và trả tiêu điểm về nút mở menu khi Esc.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (dropdownRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Khi mở, đưa tiêu điểm vào mục đầu tiên của menu.
  useEffect(() => {
    if (!open) return;
    const firstItem = dropdownRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
    firstItem?.focus();
  }, [open]);

  if (restoring) {
    return (
      <div className={styles.userTrigger} aria-busy="true" aria-label="Đang khôi phục phiên đăng nhập">
        <div className={styles.userAvatar}>
          <Icon name="user" size={18} />
        </div>
        <span className={styles.userName}>Đang tải…</span>
      </div>
    );
  }

  if (user.role === 'GUEST') {
    return (
      <div className={styles.guestActions} aria-label="Tài khoản">
        <ButtonLink to={routes.auth.login} variant="outline" size="sm">
          Đăng nhập
        </ButtonLink>
        <ButtonLink
          to={routes.auth.register}
          variant="primary"
          size="sm"
          className={styles.guestRegister}
        >
          Đăng ký
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className={styles.userMenuWrap}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.userTrigger}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className={styles.userAvatar}>
          <Icon name="user" size={18} />
        </div>
        <span className={styles.userName}>{user.name}</span>
        <Icon name="chevronDown" size={14} />
      </button>

      {open && (
        <div ref={dropdownRef} className={styles.userDropdown} role="menu" aria-label="Tài khoản">
          <div className={styles.userDropdownHeader}>
            <div className={styles.userFull}>{user.name}</div>
            <div className={styles.userEmail}>{user.email}</div>
          </div>

          <div className={styles.dropdownSection}>
            <Link
              role="menuitem"
              to={routes.account.overview}
              className={styles.dropdownItem}
              onClick={() => setOpen(false)}
            >
              <Icon name="dashboard" size={16} /> Tổng quan tài khoản
            </Link>
            <Link
              role="menuitem"
              to={routes.account.orders}
              className={styles.dropdownItem}
              onClick={() => setOpen(false)}
            >
              <Icon name="package" size={16} /> Đơn hàng của tôi
            </Link>
            <Link
              role="menuitem"
              to={routes.account.requests}
              className={styles.dropdownItem}
              onClick={() => setOpen(false)}
            >
              <Icon name="file" size={16} /> Yêu cầu và báo giá
            </Link>
            <Link
              role="menuitem"
              to={routes.account.addresses}
              className={styles.dropdownItem}
              onClick={() => setOpen(false)}
            >
              <Icon name="mapPin" size={16} /> Địa chỉ giao hàng
            </Link>
            <Link
              role="menuitem"
              to={routes.account.verify}
              className={styles.dropdownItem}
              onClick={() => setOpen(false)}
            >
              <Icon name="shield" size={16} /> Xác minh danh tính NFC
            </Link>
            <Link
              role="menuitem"
              to={routes.account.profile}
              className={styles.dropdownItem}
              onClick={() => setOpen(false)}
            >
              <Icon name="user" size={16} /> Thông tin cá nhân
            </Link>
          </div>

          {/* Lối vào Kênh người bán nằm ở thanh trên cùng của header. */}
          {user.role === 'ADMIN' && (
            <>
              <div className={styles.dropdownDivider} />
              <div className={styles.dropdownSection}>
                <Link
                  role="menuitem"
                  to={routes.admin.overview}
                  className={`${styles.dropdownItem} ${styles.adminLink}`}
                  onClick={() => setOpen(false)}
                >
                  <Icon name="shield" size={16} /> Khu Quản trị hệ thống
                </Link>
              </div>
            </>
          )}

          <div className={styles.dropdownDivider} />

          <div className={styles.dropdownSection}>
            <button
              type="button"
              role="menuitem"
              className={styles.dropdownItem}
              onClick={() => {
                setOpen(false);
                // Đăng xuất thật: xoá token và hồ sơ, rồi về trang đăng nhập.
                // Trước đây mục này chỉ là một liên kết, nên token vẫn còn
                // trong vault và F5 lại đưa người dùng trở lại khu vực đã bảo vệ.
                void sessionApi.logout().finally(() => {
                  navigate(routes.auth.login, { replace: true });
                });
              }}
            >
              <Icon name="logout" size={16} /> Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
