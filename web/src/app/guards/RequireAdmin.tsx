import styles from './RequireAdmin.module.css';
import { type ReactNode } from 'react';
import { useCurrentUser, switchDemoActor } from '@/entities/user';
import { Button, Card, Icon } from '@/shared/ui';

interface Props {
  children: ReactNode;
}

export function RequireAdmin({ children }: Props) {
  const user = useCurrentUser();

  if (user.role !== 'ADMIN') {
    return (
      <div className={styles.page}>
        <Card padding="lg" className={styles.forbiddenCard}>
          <div className={styles.forbiddenIcon}>
            <Icon name="shield" size={48} />
          </div>
          <h2 className={styles.forbiddenTitle}>Từ chối quyền truy cập (403)</h2>
          <p className={styles.forbiddenText}>
            Khu vực Quản trị sàn (Zone Q) chỉ dành cho người dùng có vai trò <strong>Quản trị viên (ADMIN)</strong>.
            Tài khoản hiện tại: <strong>{user.name}</strong> ({user.role}).
          </p>
          <div className={styles.forbiddenActions}>
            <Button
              variant="primary"
              size="md"
              onClick={() => switchDemoActor('linh')}
            >
              👑 Chuyển sang Admin Linh
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => window.location.href = '/'}
            >
              Về trang chủ
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
