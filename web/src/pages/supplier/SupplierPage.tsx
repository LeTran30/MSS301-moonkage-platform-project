import { useParams } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { AddToCartButton } from '../../features/cart';
import { ProductGrid, useShopProducts } from '../../features/catalog';
import { SupplierProfileView, useSupplier } from '../../features/suppliers';
import { EmptyState, ErrorState, LoadingState } from '../../shared/ui';
import { useLoginRedirect } from '../useLoginRedirect';

/** M3.3 */
export function SupplierPage() {
  const { supplierId = '' } = useParams();
  const { session } = useAuth();
  const supplier = useSupplier(supplierId);
  const products = useShopProducts(supplierId);
  const toLogin = useLoginRedirect();
  if (supplier.kind === 'loading') return <LoadingState />;
  if (supplier.kind === 'error') return <ErrorState message={supplier.message} onRetry={supplier.reload} />;
  if (!supplier.data) return <EmptyState title="Không có đơn vị này" />;
  const list = products.kind === 'loaded' ? products.data : [];
  return (
    <div className="shop__inner">
      <SupplierProfileView
        supplier={supplier.data}
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
