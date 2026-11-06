import { formatCurrency } from '@/shared/utils';
import { Badge, Button, Card } from '@/shared/ui';
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

/** Thẻ sản phẩm trong danh mục của gian hàng (B4.0). */
export function VendorProductCard({
  product,
  busy,
  onToggleVisibility,
  onEdit,
  attributeName,
}: VendorProductCardProps) {
  return (
    <Card className={styles.productCard}>
      <div className={styles.cardImageWrap}>
        <img
          src={product.images?.[0]?.url || '/images/banh-nuong.jpg'}
          alt={product.name ?? ''}
          className={styles.productImg}
          loading="lazy"
          decoding="async"
        />
        <div className={styles.statusBadgeWrap}>
          <Badge tone={product.status === 'ON_SALE' ? 'green' : 'neutral'}>
            {product.status === 'ON_SALE' ? 'Đang mở bán' : 'Đang ẩn'}
          </Badge>
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
          <span>
            Tồn kho: <strong>{product.stock ?? 0} bánh</strong>
          </span>
        </div>
      </div>

      <div className={styles.cardActions}>
        <Button
          variant={product.status === 'ON_SALE' ? 'secondary' : 'primary'}
          size="sm"
          loading={busy}
          onClick={() => onToggleVisibility(product)}
        >
          {product.status === 'ON_SALE' ? 'Ẩn sản phẩm' : 'Bật hiển thị'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
          Chỉnh sửa
        </Button>
      </div>
    </Card>
  );
}
