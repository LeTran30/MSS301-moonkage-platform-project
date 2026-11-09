import { useState } from 'react';
import { Badge, ButtonLink, Card, Tabs } from '@/shared/ui';
import { routes } from '@/shared/config';
import styles from './AdminConfigPage.module.css';

type AdminConfigTab = 'TAXONOMY' | 'SHIPPING' | 'FEES' | 'VOUCHER';

/**
 * Q6.0 — Trung tâm cấu hình sàn.
 *
 * Mỗi thẻ trỏ tới một trang cấu hình thật, đọc và ghi qua API:
 *  - Q6.4 Danh mục Vỏ & Nhân  → `GET/POST/PATCH /api/cake-attributes`
 *  - Q6.1 Biểu phí liên tỉnh → `GET/PUT /api/interprovince-fees`
 *  - Q6.2 Phí mở bán        → `GET/PUT /api/registration-fee-config`
 *
 * Voucher (Q6.3) thuộc nhóm hoãn của phiên bản này: máy chủ đã gỡ
 * `VoucherController`, nên trang đó chỉ giải thích, không giả vờ hoạt động.
 */
export function AdminConfigPage() {
  const [activeTab, setActiveTab] = useState<AdminConfigTab>('TAXONOMY');

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cấu hình quy tắc & Tham số sàn</h1>
          <p className={styles.desc}>
            Quản trị danh mục Vỏ &amp; Nhân, biểu phí ship liên tỉnh và chính sách phí nền tảng toàn
            sàn.
          </p>
        </div>
      </div>

      <Tabs<AdminConfigTab>
        items={[
          { id: 'TAXONOMY', label: '1. Danh mục Vỏ & Nhân bánh' },
          { id: 'SHIPPING', label: '2. Biểu phí ship liên tỉnh' },
          { id: 'FEES', label: '3. Phí mở bán & Chiết khấu sàn' },
          { id: 'VOUCHER', label: '4. Voucher hệ thống' },
        ]}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'TAXONOMY' && (
        <Card padding="lg" className={styles.deferredCard}>
          <div className={styles.deferredHeader}>
            <h2 className={styles.deferredTitle}>Danh mục Vỏ &amp; Nhân bánh</h2>
            <Badge tone="green" size="md">
              Quản lý trực tiếp
            </Badge>
          </div>
          <p className={styles.desc}>
            Quản trị viên thêm, đổi nhãn và ẩn/hiện từng giá trị. Mã giá trị và thứ tự hiển thị do
            máy chủ sinh từ tên; bộ lọc của khách hàng chỉ hiện giá trị đang hoạt động.
          </p>
          <div className={styles.deferredActions}>
            <ButtonLink to={routes.admin.cakeCatalog} variant="outline">
              Mở từ điển Vỏ &amp; Nhân
            </ButtonLink>
          </div>
        </Card>
      )}

      {activeTab === 'SHIPPING' && (
        <Card padding="lg" className={styles.deferredCard}>
          <div className={styles.deferredHeader}>
            <h2 className={styles.deferredTitle}>Biểu phí vận chuyển liên tỉnh</h2>
            <Badge tone="green" size="md">
              Quản lý trực tiếp
            </Badge>
          </div>
          <p className={styles.desc}>
            Biểu phí tính theo từng tỉnh. Máy chủ từ chối lưu một bảng thiếu tỉnh, nên bảng luôn ghi
            đủ toàn bộ tỉnh trước khi lưu.
          </p>
          <div className={styles.deferredActions}>
            <ButtonLink to={routes.admin.interprovinceFee} variant="outline">
              Mở biểu phí liên tỉnh
            </ButtonLink>
          </div>
        </Card>
      )}

      {activeTab === 'FEES' && (
        <Card padding="lg" className={styles.deferredCard}>
          <div className={styles.deferredHeader}>
            <h2 className={styles.deferredTitle}>Phí mở bán gian hàng</h2>
            <Badge tone="green" size="md">
              Quản lý trực tiếp
            </Badge>
          </div>
          <p className={styles.desc}>
            Mức phí kích hoạt gian hàng được đặt ở mức đang hiệu hành; một mức đã thu không bao giờ
            bị thay đổi.
          </p>
          <div className={styles.deferredActions}>
            <ButtonLink to={routes.admin.openingFee} variant="outline">
              Mở cấu hình phí mở bán
            </ButtonLink>
          </div>
        </Card>
      )}

      {activeTab === 'VOUCHER' && (
        <Card padding="lg" className={styles.deferredCard}>
          <div className={styles.deferredHeader}>
            <h2 className={styles.deferredTitle}>Quản lý voucher hệ thống</h2>
            <Badge tone="amber" size="md">
              Chưa có trong phiên bản này
            </Badge>
          </div>
          <p className={styles.desc}>
            Tính năng dùng voucher và quản lý voucher thuộc nhóm hoãn của phiên bản này, và máy chủ
            đã gỡ <code>VoucherController</code>.
          </p>
          <div className={styles.deferredActions}>
            <ButtonLink to={routes.admin.vouchers} variant="outline">
              Mở trang Voucher
            </ButtonLink>
          </div>
        </Card>
      )}
    </div>
  );
}
