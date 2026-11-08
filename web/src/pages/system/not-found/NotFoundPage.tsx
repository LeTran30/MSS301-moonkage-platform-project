import { routes } from '@/shared/config';
import { ButtonLink, Breadcrumbs, Icon } from '@/shared/ui';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[{ label: 'Trang chủ', to: routes.base.home }, { label: '404 - Không tìm thấy' }]}
      />
      <div className={styles.container}>
        <div className={styles.moonIllustration} aria-hidden="true">
          <Icon name="cake" size={72} />
        </div>
        <h1 className={styles.title}>Không tìm thấy trang</h1>
        <p className={styles.desc}>
          Ánh trăng soi bóng nhưng con đường bạn tìm kiếm không tồn tại trên bản đồ Moonkage hoặc
          gian hàng đã dời sang phố khác.
        </p>
        <div className={styles.actions}>
          <ButtonLink to={routes.base.home} variant="primary">
            Về Sảnh Trăng (Trang Chủ)
          </ButtonLink>
          <ButtonLink to={routes.base.catalog} variant="outline">
            Xem Danh Mục Bánh
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
