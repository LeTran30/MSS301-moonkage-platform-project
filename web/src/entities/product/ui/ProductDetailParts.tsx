import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/config/routes';
import { Avatar, PhotoFrame } from '@/shared/ui';
import { formatRating, formatVnd } from '@/shared/utils/money';
import type { ProductDetail } from '../model/types';
import { productStrings } from '../strings';
import styles from './ProductDetailParts.module.css';

const GALLERY_SLOTS = 5;

/** Main photo and four thumbnails; slots without a photo stay labelled frames. */
export function ProductGallery({ product }: { product: ProductDetail }) {
  const slots = Array.from({ length: GALLERY_SLOTS }, (_, i) => product.images[i]);
  const [current, setCurrent] = useState(0);
  return (
    <div className={`${styles.gallery} gallery`}>
      <PhotoFrame
        src={slots[current]}
        alt={product.name}
        label={current === 0 ? productStrings.mainPhoto : productStrings.gallery(current + 1)}
        ratio="4 / 3"
      />
      <div className={`${styles.galleryThumbs} gallery__thumbs`}>
        {slots.slice(1).map((src, i) => (
          <button key={i} type="button" className={`${styles.galleryThumb} gallery__thumb`} aria-pressed={current === i + 1} onClick={() => setCurrent(current === i + 1 ? 0 : i + 1)}>
            <PhotoFrame src={src} alt={productStrings.gallery(i + 2)} label={productStrings.gallery(i + 2)} ratio="4 / 3" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProductHead({ product }: { product: ProductDetail }) {
  return (
    <div className={`${styles.productHead} product-head`}>
      <Link to={routes.base.vendorStorefront(product.shopId)} className={`${styles.shopLink} product-head__shop`}>
        {product.shopName}
        {product.district ? ` · ${product.district}` : ''}
      </Link>
      <h1 className="title-text">{product.name}</h1>
      <p className="muted mk-num">
        {product.pack}
        {product.rating !== null && product.reviewCount > 0 && (
          <>
            {' · '}
            <span className="mk-star" aria-hidden="true">
              ★
            </span>{' '}
            {formatRating(product.rating)} ({product.reviewCount} {productStrings.reviewsUnit})
          </>
        )}
      </p>
      <p className={`${styles.price} product-head__price mk-num`}>
        {formatVnd(product.price)}
        <small>{productStrings.vat}</small>
      </p>
    </div>
  );
}

/** Stock, area, fee and quantity; `action` renders the add button for the chosen quantity. */
export function BuyBox({ product, area, action }: { product: ProductDetail; area: string; action: (quantity: number) => ReactNode }) {
  const [quantity, setQuantity] = useState(1);
  const delivered = product.deliverTo.includes(area);
  return (
    <div className={`${styles.buyBox} buy-box`}>
      <div className={`${styles.buyBoxInfo} buy-box__info`}>
        <span className={`mk-badge ${delivered ? 'mk-badge--ok' : 'mk-badge--warn'}`}>
          {delivered ? productStrings.stockArea(product.stock, area) : productStrings.notDelivered(area)}
        </span>
        <span className="muted">{productStrings.fee(formatVnd(product.shippingFrom))}</span>
      </div>
      <div className={`${styles.buyBoxRow} buy-box__row`}>
        <div className={`mk-field ${styles.buyBoxQty} buy-box__qty`}>
          <label htmlFor="qty">{productStrings.quantity}</label>
          <input
            id="qty"
            className="mk-num"
            inputMode="numeric"
            type="number"
            min={1}
            max={product.stock}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value) || 1)))}
          />
        </div>
        {delivered && action(quantity)}
      </div>
    </div>
  );
}

export function CustomOrderNudge({ product }: { product: ProductDetail }) {
  if (!product.shopTakesCustom) return null;
  return (
    <div className={`${styles.nudge} nudge`}>
      <div>
        <p className={`${styles.nudgeTitle} nudge__title`}>{productStrings.customTitle}</p>
        <p className="muted">{productStrings.customBody}</p>
      </div>
      <Link to={routes.base.directRequest(product.shopId)} className="mk-btn mk-btn--outline mk-btn--sm">
        {productStrings.customCta}
      </Link>
    </div>
  );
}

export function ProductSpecs({ product }: { product: ProductDetail }) {
  return (
    <section aria-labelledby="specs-heading" className={`${styles.specs} specs`}>
      <h2 id="specs-heading" className="detail-heading">
        {productStrings.inBox}
      </h2>
      <dl className={`${styles.facts} facts`}>
        {product.specs.map((s) => (
          <div key={s.label} className={`${styles.factsRow} facts__row`}>
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ReviewList({ product }: { product: ProductDetail }) {
  return (
    <section aria-labelledby="reviews-heading" className={`${styles.reviews} reviews`}>
      <h2 id="reviews-heading" className="detail-heading">
        {productStrings.reviews(product.reviewCount)}
      </h2>
      {product.reviews.length === 0 ? (
        <p className="muted">{productStrings.noReviews}</p>
      ) : (
        <ul className={`${styles.reviewsList} reviews__list`}>
          {product.reviews.map((r) => (
            <li key={`${r.name}-${r.date}`} className={`${styles.reviewsItem} reviews__item`}>
              <Avatar initials={r.initial} />
              <div>
                <p>
                  <strong>{r.name}</strong> · {r.stars} ★ <span className="caption-text">{r.date}</span>
                </p>
                <p>{r.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
