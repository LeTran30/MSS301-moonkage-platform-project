import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { formatRating, formatVnd } from '../../../shared/utils/money';
import type { ProductSummary } from '../api/types';
import { catalogStrings } from '../strings';

/**
 * DS ProductCard (mk-card): flat, the photo on a square muted frame, name and price on one row, shop · district,
 * pack · stock, stars only when there are real reviews, then the action the page passes in (Thêm vào giỏ).
 * A product without photos keeps the empty frame with its name, never a stand-in picture.
 */
export function ProductCard({ product, action }: { product: ProductSummary; action?: ReactNode }) {
  const to = routes.product(product.id);
  return (
    <article className="mk-card">
      <div className="mk-card__img">
        {product.images[0] ? <img src={product.images[0]} alt="" /> : <span className="mk-card__empty">{product.name}</span>}
      </div>
      <div className="mk-card__info">
        <div className="mk-card__row">
          <h3 className="mk-card__name">
            <Link to={to}>{product.name}</Link>
          </h3>
          <span className="mk-price">{formatVnd(product.price)}</span>
        </div>
        <p className="mk-card__shop">
          {product.shopName}
          {product.district ? ` · ${product.district}` : ''}
        </p>
        <p className="mk-card__meta mk-num">{catalogStrings.packStock(product.pack, product.stock)}</p>
        {product.rating !== null && product.reviewCount > 0 && (
          <p className="mk-card__meta mk-num">
            <span className="mk-star" aria-hidden="true">
              ★
            </span>{' '}
            {formatRating(product.rating)} ({product.reviewCount} {catalogStrings.reviewsUnit})
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
    <ul className="product-grid" aria-labelledby={labelledBy}>
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} action={renderAction?.(p)} />
        </li>
      ))}
    </ul>
  );
}
