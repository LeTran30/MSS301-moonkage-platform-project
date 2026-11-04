import { memo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Badge, Card, Icon } from '@/shared/ui';
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
export const ProductCard = memo(function ProductCard({ product, actions, showVendor = true }: Props) {
  return (
    <Card as="article" padding="none" interactive className={styles.card}>
      <Link to={routes.base.product(product.id)} className={styles.imageLink}>
        <img
          src={product.images[0] || '/images/banh-nuong.jpg'}
          alt={product.name}
          className={styles.image}
          loading="lazy"
          decoding="async"
        />
        <div className={styles.tagWrap}>
          <Badge tone={product.deliveryTag === 'Giao toàn quốc' ? 'gold' : 'neutral'} size="sm">
            <Icon name="truck" size={12} /> {product.deliveryTag}
          </Badge>
          {product.bulkQuoteThreshold && (
            <Badge tone="red" size="sm" title={`Đặt trên ${product.bulkQuoteThreshold} hộp có thể yêu cầu báo giá`}>
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
        <div className={styles.priceRow}>
          <span className={styles.price}>{formatCurrency(product.price)}</span>
          <div className={styles.rating}>
            <Icon name="star" size={13} className={styles.starIcon} />
            <span>{product.rating}</span>
            <span className={styles.sold}>({product.soldCount} đã bán)</span>
          </div>
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </Card>
  );
});
