import { type ReactNode } from 'react';
import { useCurrentUser, useIsRestoringSession } from '@/entities/user';
import { Button, Card, Icon, PageLoader } from '@/shared/ui';
import styles from './RequireAdmin.module.css';

interface Props {
  children: ReactNode;
}

export function RequireAdmin({ children }: Props) {
  const user = useCurrentUser();
  const restoring = useIsRestoringSession();

  // Đang khôi phục phiên: chưa biết vai trò, nên chưa thể kết luận là 403.
  if (restoring) {
    return <PageLoader />;
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className={styles.page}>
        <Card padding="lg" className={styles.forbiddenCard}>
          <div className={styles.forbiddenIcon}>
            <Icon name="shield" size={48} />
          </div>
          <h2 className={styles.forbiddenTitle}>Từ chối quyền truy cập (403)</h2>
          <p className={styles.forbiddenText}>
            Khu vực Quản trị sàn chỉ dành cho người dùng có vai trò{' '}
            <strong>Quản trị viên (ADMIN)</strong>. Tài khoản hiện tại: <strong>{user.name}</strong>{' '}
            ({user.role}).
          </p>
          <div className={styles.forbiddenActions}>
            <Button variant="secondary" size="md" onClick={() => (window.location.href = '/')}>
              Về trang chủ
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
