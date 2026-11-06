import { routes } from '@/shared/config';
import { Badge, Breadcrumbs, ButtonLink, Card } from '@/shared/ui';
import { useMyVendorId, useOrderProfile } from '@/entities/vendor';
import styles from './VendorCapacityPage.module.css';

/**
 * Lịch công suất của gian hàng.
 *
 * Tính năng khai báo lịch theo tuần chưa mở trong phiên bản hiện tại. Màn hình
 * vẫn hiển thị công suất tuần mà hồ sơ nhận đặt hàng đã khai báo và nói rõ
 * phần nào còn đang chờ.
 */
export function VendorCapacityPage() {
  const asyncVendorId = useMyVendorId();
  const vendorId = asyncVendorId.kind === 'loaded' && asyncVendorId.data ? asyncVendorId.data : '';
  const asyncProfile = useOrderProfile(vendorId);
  const profile = asyncProfile.kind === 'loaded' ? asyncProfile.data : null;

  const weeklyCapacity = profile?.weeklyCapacity ?? null;

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Kênh Xưởng', to: routes.vendor.overview },
          { label: 'Cài đặt bán hàng', to: routes.vendor.settings },
          { label: 'Lịch công suất' },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Lịch Công Suất Của Gian Hàng</h1>
          <p className={styles.subtitle}>
            Số hộp bánh Trung Thu xưởng nhận được mỗi tuần, để người mua biết trước khi gửi yêu cầu.
          </p>
        </div>
        <Badge tone="amber" size="md">
          Chưa có trong phiên bản này
        </Badge>
      </div>

      <Card padding="lg" className={styles.card}>
        <h2 className={styles.cardTitle}>Trạng thái của tính năng</h2>
        <p className={styles.para}>
          Lịch công suất theo từng tuần đã được <strong>hoãn</strong> sang phiên bản sau. Màn hình
          này hiện công suất tuần mà xưởng đã khai báo trong hồ sơ nhận đặt hàng; phần lịch theo tuần
          sẽ được bổ sung sau.
        </p>

        <div className={styles.factBox}>
          <span className={styles.factLabel}>Công suất tuần trong hồ sơ nhận đặt hàng</span>
          {weeklyCapacity !== null ? (
            <span className={styles.factValue}>{weeklyCapacity} hộp / tuần</span>
          ) : (
            <span className={styles.factEmpty}>
              Chưa khai báo — xưởng chưa thiết lập công suất tuần.
            </span>
          )}
        </div>

        <p className={styles.para}>
          Trong lúc chờ, xưởng có thể khai báo <strong>số lượng tối thiểu</strong> và{' '}
          <strong>thời gian chuẩn bị</strong> ở tab “Điều kiện nhận đặt hàng”, và người mua xem được
          hai thông tin đó trong báo giá của xưởng.
        </p>

        <div className={styles.actions}>
          <ButtonLink to={routes.vendor.bulkTerms} variant="outline">
            Điều Kiện Nhận Đặt Hàng
          </ButtonLink>
          <ButtonLink to={routes.vendor.settings} variant="ghost">
            Quay Lại Cài Đặt
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
