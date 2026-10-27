import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/config/routes';
import { formatRating, formatVnd } from '@/shared/utils/money';
import type { ProductSummary } from '../model/types';
import styles from './ProductCard.module.css';

/**
 * DS ProductCard (mk-card): flat, the photo on a square muted frame, name and price on one row, shop · district,
 * pack · stock, stars only when there are real reviews, then the action the page passes in (Thêm vào giỏ).
 * A product without photos keeps the empty frame with its name, never a stand-in picture.
 */
export function ProductCard({ product, action }: { product: ProductSummary; action?: ReactNode }) {
  const to = routes.base.product(product.id);
  return (
    <article className={`${styles.card} mk-card`}>
      <div className={styles.imageBox}>
        {product.images[0] ? (
          <img src={product.images[0]} alt="" className={styles.image} />
        ) : (
          <span className={styles.empty}>{product.name}</span>
        )}
      </div>
      <div className={styles.info}>
        <div className={styles.row}>
          <h3 className={styles.name}>
            <Link to={to} className={styles.link}>
              {product.name}
            </Link>
          </h3>
          <span className="mk-price">{formatVnd(product.price)}</span>
        </div>
        <p className={styles.meta}>
          {product.shopName}
          {product.district ? ` · ${product.district}` : ''}
        </p>
        <p className={`${styles.meta} mk-num`}>{`${product.pack} · còn ${product.stock} hộp`}</p>
        {product.rating !== null && product.reviewCount > 0 && (
          <p className={`${styles.meta} mk-num`}>
            <span className="mk-star" aria-hidden="true">
              ★
            </span>{' '}
            {formatRating(product.rating)} ({product.reviewCount} nhận xét)
          </p>
        )}
      </div>
      {action}
    </article>
  );
}

export function ProductGrid({
  products,
  renderAction,
  labelledBy,
}: {
  products: ProductSummary[];
  renderAction?: (product: ProductSummary) => ReactNode;
  labelledBy?: string;
}) {
  return (
    <ul className={`${styles.grid} product-grid`} aria-labelledby={labelledBy}>
      {products.map((p) => (
        <li key={p.id} className={styles.gridItem}>
          <ProductCard product={p} action={renderAction?.(p)} />
        </li>
      ))}
    </ul>
  );
}
