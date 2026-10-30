import { Link, useParams } from 'react-router-dom';
import {
  BuyBox,
  CustomOrderNudge,
  ProductGallery,
  ProductHead,
  productStrings,
  ProductSpecs,
  ReviewList,
  useProduct,
} from '@/entities/product';
import { useCurrentUser } from '@/entities/user';
import { AddToCartButton } from '@/features/add-to-cart';
import { useDeliveryArea } from '@/features/choose-delivery-area';
import { useLoginRedirect } from '@/features/login';
import { routes } from '@/shared/config/routes';
import { ErrorState, LoadingState } from '@/shared/ui';

/** M2.1: gallery on the left; name, price, buy box, custom-order nudge and contents on the right; reviews below. */
export function ProductDetailPage() {
  const { productId = '' } = useParams();
  const session = useCurrentUser();
  const { area } = useDeliveryArea();
  const product = useProduct(productId);
  const toLogin = useLoginRedirect();

  if (product.kind === 'loading') return <div className="shop__inner page"><LoadingState /></div>;
  if (product.kind === 'error') return <div className="shop__inner page"><ErrorState message={product.message} onRetry={product.reload} /></div>;
  if (!product.data) {
    return (
      <div className="shop__inner page">
        <p className="empty-state__title">{productStrings.notFound}</p>
        <Link to={routes.base.products} className="mk-btn mk-btn--text">
          {productStrings.backToList}
        </Link>
      </div>
    );
  }

  const p = product.data;
  return (
    <div className="shop__inner page">
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link to={routes.base.home}>Trang chủ</Link> › <Link to={routes.base.products}>{productStrings.listTitle}</Link> › <span aria-current="page">{p.name}</span>
      </nav>
      <div className="product-detail">
        <ProductGallery product={p} />
        <div className="product-detail__info">
          <ProductHead product={p} />
          <BuyBox
            product={p}
            area={area}
            action={(quantity) => (
              <AddToCartButton productId={p.id} productName={p.name} quantity={quantity} loggedIn={Boolean(session)} onNeedLogin={toLogin} />
            )}
          />
          <CustomOrderNudge product={p} />
          <ProductSpecs product={p} />
        </div>
      </div>
      <ReviewList product={p} />
    </div>
  );
}
