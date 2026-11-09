import { Badge, Button, Card } from '@/shared/ui';
import { formatDate, shortCode } from '@/shared/utils';
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

/** Tên loại hình đơn vị (BR-33). */
const ENTITY_TYPE_LABELS: Record<NonNullable<VendorResponseDto['entityType']>, string> = {
  HOUSEHOLD_BUSINESS: 'Hộ kinh doanh',
  SOLE_PROPRIETORSHIP: 'Doanh nghiệp tư nhân',
};

/** Màu của từng trạng thái: chờ việc của admin thì vàng, đã xong thì xanh, dừng thì đỏ. */
const STATUS_TONES: Record<VendorStatus, 'gold' | 'amber' | 'green' | 'red'> = {
  PENDING: 'gold',
  NEEDS_INFO: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
  LOCKED: 'red',
};

/** Thẻ hồ sơ người bán trong danh sách quản trị (Q2.0). */
export function VendorApplicationCard({
  vendor,
  onReview,
  onAttachFeeInvoice,
}: VendorApplicationCardProps) {
  const status = vendor.status as VendorStatus | undefined;

  return (
    <Card className={styles.vendorCard}>
      <div className={styles.cardHeader}>
        <div className={styles.vendorMainInfo}>
          <div>
            <h3 className={styles.brandName}>{vendor.businessName || 'Hồ sơ chưa đặt tên'}</h3>
            <p className={styles.registeredName}>
              Hồ sơ #{shortCode(vendor.id)}
              {vendor.createdAt ? ` · Nộp ngày ${formatDate(vendor.createdAt)}` : ''}
            </p>
          </div>
        </div>

        <div className={styles.statusCol}>
          <Badge tone={status ? STATUS_TONES[status] : 'neutral'}>
            {status ? VENDOR_STATUS_LABELS[status] : 'Chưa rõ'}
          </Badge>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.legalGrid}>
          <div className={styles.legalItem}>
            <span className={styles.legalLabel}>Loại hình:</span>
            <strong>{vendor.entityType ? ENTITY_TYPE_LABELS[vendor.entityType] : '—'}</strong>
          </div>

          <div className={styles.legalItem}>
            <span className={styles.legalLabel}>Cách bán:</span>
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

          <div className={styles.legalItem}>
            <span className={styles.legalLabel}>Phí mở bán:</span>
            <strong>{vendor.registrationFeePaid ? 'Đã đóng' : 'Chưa đóng'}</strong>
          </div>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.btnGroup}>
          <Button variant="secondary" size="sm" onClick={() => onReview(vendor)}>
            {status === 'PENDING' ? 'Thẩm định hồ sơ' : 'Xem hồ sơ'}
          </Button>
          {onAttachFeeInvoice && vendor.registrationFeePaid && (
            <Button variant="ghost" size="sm" onClick={() => onAttachFeeInvoice(vendor)}>
              Gắn hoá đơn phí
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
