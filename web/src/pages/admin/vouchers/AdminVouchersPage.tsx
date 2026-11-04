import { routes } from '@/shared/config';
import { Badge, Breadcrumbs, ButtonLink, Card } from '@/shared/ui';
import styles from './AdminVouchersPage.module.css';

/**
 * Q6.3 — Quản lý voucher hệ thống.
 *
 * The feature is **deferred** for this release: `requirements.md` mục 4.3 lists
 * FR-13 (dùng voucher) và FR-50 (quản lý voucher) under "Hoãn (không có trong
 * demo)", and the backend dropped `VoucherController` (BE-10). The screen still
 * exists so the route `/quan-tri/cau-hinh/voucher` from the IA does not end in a
 * 404, and it explains what is coming instead of pretending the feature works.
 */
export function AdminVouchersPage() {
  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Quản Trị', to: routes.admin.overview },
          { label: 'Cấu hình', to: routes.admin.config },
          { label: 'Voucher hệ thống' },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản Lý Voucher Hệ Thống (Q6.3)</h1>
          <p className={styles.subtitle}>
            Tạo mã giảm giá cho đơn mua lẻ: số tiền giảm cố định và thời hạn sử dụng.
          </p>
        </div>
        <Badge tone="amber" size="md">
          Hoãn trong bản demo
        </Badge>
      </div>

      <Card padding="lg" className={styles.card}>
        <h2 className={styles.cardTitle}>Vì sao màn hình này chưa có chức năng?</h2>
        <p className={styles.para}>
          Đặc tả nghiệp vụ <code>FR-13</code> (dùng voucher hệ thống) và <code>FR-50</code> (quản lý
          voucher) được xếp vào nhóm <strong>hoãn</strong> cho bản demo hiện tại. Máy chủ cũng đã gỡ
          bỏ <code>VoucherController</code>, nên chưa có API để tạo, sửa hay huỷ một mã voucher.
        </p>
        <p className={styles.para}>
          Màn hình này được giữ lại để bản đồ giao diện (IA) không bị thiếu mã trang{' '}
          <code>Q6.3</code> và để người dùng biết tính năng sẽ tới. Khi bản API voucher hoàn tất,
          màn hình sẽ được nối vào <code>GET/POST /api/vouchers</code>.
        </p>

        <div className={styles.rules}>
          <h3 className={styles.rulesTitle}>Quy tắc đã chốt sẵn cho bản sau</h3>
          <ul className={styles.ruleList}>
            <li>Voucher chỉ áp dụng cho đơn <strong>mua ngay</strong>, không áp dụng cho đơn đặt hàng (BR-32).</li>
            <li>Giảm giá là số tiền cố định bằng VND; điều kiện thêm (phần trăm, mức tối thiểu) chưa chốt.</li>
            <li>Voucher do đội vận hành tạo, không phải người bán.</li>
            <li>Phần giảm do nền tảng hay người bán chịu vẫn đang chờ quyết định nghiệp vụ.</li>
          </ul>
        </div>

        <div className={styles.actions}>
          <ButtonLink to={routes.admin.config} variant="outline">
            Quay Lại Cấu Hình
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
