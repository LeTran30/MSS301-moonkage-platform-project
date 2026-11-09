import { routes } from '@/shared/config';
import { Badge, Breadcrumbs, ButtonLink, Card } from '@/shared/ui';
import styles from './AdminVouchersPage.module.css';

/**
 * Quản lý voucher hệ thống.
 *
 * Tính năng chưa mở trong phiên bản hiện tại. Màn hình được giữ lại để bản
 * đồ giao diện không bị thiếu mã trang và để người dùng biết tính năng sẽ
 * tới, thay vì hiển thị một màn hình trống.
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
          <h1 className={styles.title}>Quản lý voucher hệ thống</h1>
          <p className={styles.subtitle}>
            Tạo mã giảm giá cho đơn mua lẻ: số tiền giảm cố định và thời hạn sử dụng.
          </p>
        </div>
        <Badge tone="amber" size="md">
          Chưa có trong phiên bản này
        </Badge>
      </div>

      <Card padding="lg" className={styles.card}>
        <h2 className={styles.cardTitle}>Tính năng đang được phát triển</h2>
        <p className={styles.para}>
          Mã giảm giá do Moonkage phát hành đã được <strong>hoãn</strong> sang phiên bản sau. Tại
          thời điểm này, hệ thống chưa có chức năng tạo, sửa hay huỷ mã voucher, nên bạn chưa thể thao
          tác trên màn hình này.
        </p>
        <p className={styles.para}>
          Trong lúc chờ, các đơn hàng vẫn được áp dụng biểu phí giao hàng và phí mở gian hàng như
          bình thường. Khi tính năng hoàn tất, toàn bộ mã voucher sẽ được quản lý tại đây và áp dụng
          ngay khi thanh toán.
        </p>

        <div className={styles.rules}>
          <h3 className={styles.rulesTitle}>Cách voucher sẽ hoạt động</h3>
          <ul className={styles.ruleList}>
            <li>
              Voucher chỉ áp dụng cho đơn <strong>mua ngay</strong>, không áp dụng cho đơn đặt hàng.
            </li>
            <li>
              Giảm giá là số tiền cố định bằng VND; điều kiện thêm (phần trăm, mức tối thiểu) chưa
              chốt.
            </li>
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
