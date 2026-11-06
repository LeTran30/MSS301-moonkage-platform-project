import { routes } from '@/shared/config';
import { Badge, Breadcrumbs, ButtonLink, Card } from '@/shared/ui';
import { useMyVendorId, useOrderProfile } from '@/entities/vendor';
import styles from './VendorCapacityPage.module.css';

/**
 * B6.4 — Lịch công suất của gian hàng.
 *
 * The feature is **deferred**: `requirements.md` mục 4.3 lists FR-37 (xem công
 * suất còn lại) under "Hoãn (không có trong demo)", and the IA marks B6.4 as
 * "Hoãn" too. The screen stays so `/kenh-ban/cai-dat/cong-suat` does not end in
 * a 404; it shows the weekly capacity the order profile already carries and
 * says plainly that the weekly schedule is not in this release.
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
          <h1 className={styles.title}>Lịch Công Suất Của Gian Hàng (B6.4)</h1>
          <p className={styles.subtitle}>
            Số hộp bánh Trung Thu xưởng nhận được mỗi tuần, để người mua biết trước khi gửi yêu cầu.
          </p>
        </div>
        <Badge tone="amber" size="md">
          Hoãn trong bản demo
        </Badge>
      </div>

      <Card padding="lg" className={styles.card}>
        <h2 className={styles.cardTitle}>Trạng thái của tính năng</h2>
        <p className={styles.para}>
          Đặc tả nghiệp vụ <code>FR-37</code> (xem công suất còn lại) nằm trong nhóm{' '}
          <strong>hoãn</strong> của bản demo, nên chưa có màn hình khai báo lịch theo từng tuần. Màn hình
          này được giữ lại để bản đồ giao diện (IA) không bị thiếu mã trang <code>B6.4</code>.
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
