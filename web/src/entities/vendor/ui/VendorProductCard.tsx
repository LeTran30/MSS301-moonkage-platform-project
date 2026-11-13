import { formatCurrency } from '@/shared/utils';
import { Badge, Button, Card, Icon, ProductImage } from '@/shared/ui';
import type { VendorProductDto } from '../api/vendorProductApi';
import styles from './VendorProductCard.module.css';

interface VendorProductCardProps {
  product: VendorProductDto;
  busy: boolean;
  /** Bật/tắt hiển thị sản phẩm (FR-34, BR-24). */
  onToggleVisibility: (product: VendorProductDto) => void;
  /** Mở form sửa sản phẩm (FR-30). */
  onEdit: (product: VendorProductDto) => void;
  /** The name of a crust or filling code, from the cake taxonomy (FR-54). */
  attributeName: (code: string) => string;
}

const STATUS_BADGE = {
  ON_SALE: { tone: 'green', label: 'Đang mở bán' },
  HIDDEN: { tone: 'neutral', label: 'Đang ẩn' },
  REMOVED: { tone: 'red', label: 'Bị sàn gỡ' },
} as const;

function displayExpiry(expiryDate: string | null | undefined): string {
  if (!expiryDate) return 'Chưa cập nhật';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(expiryDate);
  if (!match) return expiryDate;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/**
 * Thẻ sản phẩm trong danh mục của gian hàng (B4.0).
 *
 * Sản phẩm bị quản trị viên gỡ (FR-46) không còn sửa, ẩn hay hiện được
 * (409 VENDOR_026), nên thẻ chỉ hiện lý do gỡ.
 */
export function VendorProductCard({
  product,
  busy,
  onToggleVisibility,
  onEdit,
  attributeName,
}: VendorProductCardProps) {
  const status = product.status ?? 'HIDDEN';
  const badge = STATUS_BADGE[status];
  const removed = status === 'REMOVED';

  return (
    <Card className={styles.productCard}>
      <div className={styles.cardImageWrap}>
        <ProductImage
          src={product.images?.[0]?.url}
          alt={product.name ?? ''}
          className={styles.productImg}
        />
        <div className={styles.statusBadgeWrap}>
          <Badge tone={badge.tone}>{badge.label}</Badge>
        </div>
      </div>

      <div className={styles.cardContent}>
        <h3 className={styles.productName}>{product.name}</h3>
        <div className={styles.priceRow}>
          <strong className={styles.price}>{formatCurrency(product.listPrice ?? 0)}</strong>
        </div>

        <div className={styles.tagsGroup}>
          <span className={styles.tagLabel}>Vỏ:</span>
          {(product.crustCodes ?? []).map((c) => (
            <span key={c} className={styles.tag}>
              {attributeName(c)}
            </span>
          ))}
        </div>

        <div className={styles.tagsGroup}>
          <span className={styles.tagLabel}>Nhân:</span>
          {(product.fillingCodes ?? []).map((f) => (
            <span key={f} className={styles.tag}>
              {attributeName(f)}
            </span>
          ))}
        </div>

        <div className={styles.stockInfo}>
          <span className={styles.expiryInfo}>
            <Icon name="calendar" size={14} />
            HSD: <strong>{displayExpiry(product.expiryDate)}</strong>
          </span>
          <span>
            Tồn kho: <strong>{product.stock ?? 0} hộp</strong>
          </span>
        </div>

        {removed && (
          <p className={styles.removedReason}>
            Lý do gỡ: {product.removedReason || 'Quản trị viên không ghi lý do.'}
          </p>
        )}
      </div>

      {!removed && (
        <div className={styles.cardActions}>
          <Button
            variant={status === 'ON_SALE' ? 'secondary' : 'primary'}
            size="sm"
            loading={busy}
            onClick={() => onToggleVisibility(product)}
          >
            {status === 'ON_SALE' ? 'Ẩn sản phẩm' : 'Bật hiển thị'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
            Chỉnh sửa
          </Button>
        </div>
      )}
    </Card>
  );
}
