import { useCurrentUser } from '@/entities/user';
import { Badge, Card, Icon } from '@/shared/ui';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const user = useCurrentUser();

  return (
    <div className={styles.container}>
      <Card padding="lg" className={styles.card}>
        <div className={styles.cardHeader}>
          <Icon name="user" size={20} />
          <h3>Thông Tin Cá Nhân (M6.5, FR-02, AC-04.12)</h3>
        </div>

        <div className={styles.infoList}>
          <div className={styles.infoRow}>
            <span>Họ và tên:</span>
            <strong>{user.name}</strong>
          </div>
          <div className={styles.infoRow}>
            <span>Địa chỉ email:</span>
            <span>{user.email}</span>
          </div>
          <div className={styles.infoRow}>
            <span>Số điện thoại:</span>
            <span>{user.phone}</span>
          </div>
          <div className={styles.infoRow}>
            <span>Trạng thái xác minh danh tính:</span>
            <Badge tone={user.nfcStatus === 'VERIFIED' ? 'green' : 'amber'}>
              {user.nfcStatus === 'VERIFIED' ? 'Đã xác minh NFC Căn cước' : 'Chưa xác minh'}
            </Badge>
          </div>
          <div className={styles.infoRow}>
            <span>Số định danh cá nhân đã che (NFR-03):</span>
            <code>{user.idCardNumberMasked || '0011••••9876'}</code>
          </div>
          <div className={styles.infoRow}>
            <span>Vai trò tài khoản:</span>
            <Badge tone="neutral">{user.role}</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
