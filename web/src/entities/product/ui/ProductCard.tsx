import { memo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Badge, Card, Icon, ProductImage } from '@/shared/ui';
import type { Product } from '../model/types';
import styles from './ProductCard.module.css';

type Props = {
  product: Product;
  actions?: ReactNode;
  showVendor?: boolean;
};

/**
 * Thẻ sản phẩm của danh mục.
 *
 * Bọc `memo` vì danh mục render hàng chục thẻ cùng lúc: khi người dùng đổi
 * bộ lọc, mọi thẻ không bị ảnh hưởng sẽ không render lại. `actions` là element
 * do cha tạo nên vẫn phải memo ở chỗ gọi (xem `CatalogPage`).
 */
export const ProductCard = memo(function ProductCard({
  product,
  actions,
  showVendor = true,
}: Props) {
  return (
    <Card as="article" padding="none" interactive className={styles.card}>
      <Link to={routes.base.product(product.id)} className={styles.imageLink}>
        <ProductImage src={product.images[0]} alt={product.name} className={styles.image} />
        <div className={styles.tagWrap}>
          <Badge tone={product.deliveryTag === 'Giao toàn quốc' ? 'gold' : 'neutral'} size="sm">
            <Icon name="truck" size={12} /> {product.deliveryTag}
          </Badge>
          {product.bulkQuoteThreshold && (
            <Badge
              tone="red"
              size="sm"
              title={`Đặt trên ${product.bulkQuoteThreshold} hộp có thể yêu cầu báo giá`}
            >
              Báo giá sỉ &gt;{product.bulkQuoteThreshold}
            </Badge>
          )}
        </div>
      </Link>
      <div className={styles.content}>
        {showVendor && (
          <div className={styles.vendorRow}>
            <Link to={routes.base.vendor(product.vendorId)} className={styles.vendorLink}>
              <Icon name="store" size={13} /> {product.vendorName}
            </Link>
            <span className={styles.location}>{product.province}</span>
          </div>
        )}
        <h3 className={styles.name}>
          <Link to={routes.base.product(product.id)} title={product.name}>
            {product.name}
          </Link>
        </h3>
        {product.expiryDate && (
          <div className={styles.expiryInfo}>
            <Icon name="calendar" size={14} />
            <span>HSD:</span>
            <strong>{product.expiryDate}</strong>
          </div>
        )}
        <div className={styles.priceRow}>
          <span className={styles.price}>{formatCurrency(product.price)}</span>
          {/*
            Điểm đánh giá và số lượng đã bán chỉ hiện khi máy chủ thật sự có dữ
            liệu: `catalog-service` chưa trả `soldCount`, nên hiện "0 đã bán" là
            con số bịa. Trường hợp thiếu thì ẩn hẳn, không hiện số 0.
          */}
          {(product.rating > 0 || product.reviewCount > 0 || product.soldCount > 0) && (
            <div className={styles.rating}>
              {product.rating > 0 && (
                <>
                  <Icon name="star" size={13} className={styles.starIcon} />
                  <span>{product.rating}</span>
                </>
              )}
              {product.reviewCount > 0 && <span className={styles.sold}>({product.reviewCount} đánh giá)</span>}
              {product.soldCount > 0 && <span className={styles.sold}>({product.soldCount} đã bán)</span>}
            </div>
          )}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </Card>
  );
});
