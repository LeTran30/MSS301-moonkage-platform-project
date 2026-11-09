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
          <h2 className={styles.forbiddenTitle}>Bạn không có quyền vào khu vực này</h2>
          <p className={styles.forbiddenText}>
            Khu vực quản trị chỉ dành cho quản trị viên của sàn. Bạn đang đăng nhập bằng tài khoản{' '}
            <strong>{user.name}</strong>.
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
