import styles from './AdminVendorDetailPage.module.css';
import { useParams } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Badge, Button, ButtonLink, Card, Breadcrumbs, toast } from '@/shared/ui';
import { useVendors } from '@/entities/vendor';

export function AdminVendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const vendors = useVendors();
  const vendor = vendors.find((v) => v.id === id) || vendors[0];

  if (!vendor) {
    return (
      <div>
        <p>Không tìm thấy nghệ nhân / xưởng bánh.</p>
        <ButtonLink to={routes.admin.vendors}>Về danh sách người bán</ButtonLink>
      </div>
    );
  }

  function handleApprove() {
    toast.success(`Đã phê duyệt hồ sơ xưởng ${vendor.name}! Đã cấp tích xanh kiểm định.`);
  }

  function handleReject() {
    toast.error(`Đã gửi yêu cầu bổ sung chứng nhận kiểm nghiệm chất lượng cho ${vendor.name}.`);
  }

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Quản Trị', to: routes.admin.overview },
          { label: 'Người bán & Xưởng bánh', to: routes.admin.vendors },
          { label: vendor.name },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Thẩm Định Xưởng Bánh: {vendor.name} (Q2.1)
          </h1>
          <p className={styles.subtitle}>
            Mã định danh: {vendor.id} · Địa bàn: {vendor.province} · Điểm uy tín: {vendor.rating}/5.0
          </p>
        </div>
        <div className={styles.actions}>
          <Button variant="primary" onClick={handleApprove}>
            Phê Duyệt Đạt Chuẩn
          </Button>
          <Button variant="outline" onClick={handleReject}>
            Yêu Cầu Bổ Sung Hồ Sơ
          </Button>
        </div>
      </div>

      <div className={styles.gridTwo}>
        <Card padding="lg" className={styles.cardBody}>
          <h2 className={styles.sectionTitle}>Hồ Sơ Năng Lực & Nguồn Gốc</h2>
          <div className={styles.keyValueList}>
            <div className={styles.keyValueRow}>
              <span className={styles.keyValueLabel}>Đại diện pháp luật:</span>
              <strong>{vendor.representativeName}</strong>
            </div>
            <div className={styles.keyValueRow}>
              <span className={styles.keyValueLabel}>Mã số thuế / ĐKKD:</span>
              <strong>{vendor.taxCode} ({vendor.province})</strong>
            </div>
            <div className={styles.keyValueRow}>
              <span className={styles.keyValueLabel}>Kinh nghiệm:</span>
              <span>Hơn 40 năm gia truyền</span>
            </div>
            <div className={styles.keyValueRow}>
              <span className={styles.keyValueLabel}>Hình thức:</span>
              <span>{vendor.sourceType}</span>
            </div>
          </div>
          <div>
            <span className={styles.captionLabel}>Giới thiệu xưởng:</span>
            <p className={styles.bodyText}>{vendor.introduction}</p>
          </div>
        </Card>

        <Card padding="lg" className={styles.cardBody}>
          <h2 className={styles.sectionTitle}>Chứng Nhận VSATTP & OCOP</h2>
          <div className={styles.certificateList}>
            <div className={styles.certificateCard}>
              <div className={styles.certificateHeader}>
                <strong className={styles.certificateTitle}>Giấy chứng nhận VSATTP số 123/2025</strong>
                <Badge tone="green">Hợp lệ</Badge>
              </div>
              <p className={styles.certificateNote}>
                Cấp bởi Chi cục ATVSTP Hà Nội · Có giá trị đến 2028
              </p>
            </div>

            <div className={styles.certificateCard}>
              <div className={styles.certificateHeader}>
                <strong className={styles.certificateTitle}>Chứng nhận OCOP 4 sao làng nghề</strong>
                <Badge tone="gold">Đạt chuẩn</Badge>
              </div>
              <p className={styles.certificateNote}>
                Dòng bánh nướng Thập Cẩm Bát Bửu truyền thống
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

