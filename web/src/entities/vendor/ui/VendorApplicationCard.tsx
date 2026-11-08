import { Badge, Button, Card } from '@/shared/ui';
import type { VendorResponseDto } from '../api/vendorDto';
import { VENDOR_STATUS_LABELS, type VendorStatus } from '../model/vendorStatusLabels';
import styles from './VendorApplicationCard.module.css';

interface VendorApplicationCardProps {
  vendor: VendorResponseDto;
  /** Mở màn hình thẩm định chi tiết (Q2.1). */
  onReview: (vendor: VendorResponseDto) => void;
  /** Mở modal gắn hoá đơn phí đăng ký (Q-36). */
  onAttachFeeInvoice?: (vendor: VendorResponseDto) => void;
}

/** Thẻ hồ sơ người bán trong danh sách quản trị (Q2.0). */
export function VendorApplicationCard({
  vendor,
  onReview,
  onAttachFeeInvoice,
}: VendorApplicationCardProps) {
  return (
    <Card className={styles.vendorCard}>
      <div className={styles.cardHeader}>
        <div className={styles.vendorMainInfo}>
          <div>
            <div className={styles.nameRow}>
              <h3 className={styles.brandName}>{vendor.businessName || 'Hồ sơ chưa đặt tên'}</h3>
              {vendor.supplySource === 'SELF_PRODUCED' && (
                <Badge tone="gold">Nghệ nhân truyền thống</Badge>
              )}
            </div>
            <p className={styles.registeredName}>Mã hồ sơ: {vendor.id}</p>
          </div>
        </div>

        <div className={styles.statusCol}>
          <Badge
            tone={
              vendor.status === 'APPROVED' ? 'green' : vendor.status === 'PENDING' ? 'gold' : 'red'
            }
          >
            {vendor.status ? VENDOR_STATUS_LABELS[vendor.status as VendorStatus] : 'Chưa rõ'}
          </Badge>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.legalGrid}>
          <div className={styles.legalItem}>
            <span className={styles.legalLabel}>Mô hình kinh doanh:</span>
            <strong>Đối chiếu trong hồ sơ chi tiết</strong>
          </div>

          <div className={styles.legalItem}>
            <span className={styles.legalLabel}>Chế độ nhận đơn:</span>
            <strong>
              {vendor.sellsShop && vendor.acceptsOrders
                ? 'Bán lẻ & Nhận đặt hàng'
                : vendor.acceptsOrders
                  ? 'Chỉ nhận đặt hàng'
                  : 'Chỉ bán lẻ'}
            </strong>
          </div>

          <div className={styles.legalItem}>
            <span className={styles.legalLabel}>Nguồn hàng:</span>
            <strong>
              {vendor.supplySource === 'SELF_PRODUCED'
                ? 'Tự sản xuất'
                : vendor.supplySource === 'RESELL'
                  ? 'Bán lại'
                  : 'Cả hai'}
            </strong>
          </div>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.capacity}>
          Chủ hồ sơ: <strong>{vendor.ownerAccountId || '—'}</strong>
        </span>

        <div className={styles.btnGroup}>
          <Button variant="secondary" size="sm" onClick={() => onReview(vendor)}>
            Thẩm định chi tiết &amp; Duyệt
          </Button>
          {onAttachFeeInvoice && (
            <Button variant="ghost" size="sm" onClick={() => onAttachFeeInvoice(vendor)}>
              Gắn hoá đơn phí
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
