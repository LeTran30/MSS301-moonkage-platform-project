import { useParams } from 'react-router-dom';
import { ProductGrid } from '@/entities/product';
import { useShopProducts } from '@/entities/product';
import { useCurrentUser } from '@/entities/user';
import { VendorStorefrontView, useVendorStorefront } from '@/entities/vendor';
import { AddToCartButton } from '@/features/add-to-cart';
import { useLoginRedirect } from '@/features/login';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui';

/** M3.3 */
export function VendorStorefrontPage() {
  const { vendorId = '' } = useParams();
  const session = useCurrentUser();
  const vendor = useVendorStorefront(vendorId);
  const products = useShopProducts(vendorId);
  const toLogin = useLoginRedirect();
  if (vendor.kind === 'loading') return <LoadingState />;
  if (vendor.kind === 'error') return <ErrorState message={vendor.message} onRetry={vendor.reload} />;
  if (!vendor.data) return <EmptyState title="Không có đơn vị này" />;
  const list = products.kind === 'loaded' ? products.data : [];
  return (
    <div className="shop__inner">
      <VendorStorefrontView
        vendor={vendor.data}
        productCount={list.length}
        products={
          list.length > 0 && (
            <ProductGrid
              products={list.slice(0, 8)}
              renderAction={(p) => <AddToCartButton productId={p.id} productName={p.name} size="sm" loggedIn={Boolean(session)} onNeedLogin={toLogin} />}
            />
          )
        }
      />
    </div>
  );
}
