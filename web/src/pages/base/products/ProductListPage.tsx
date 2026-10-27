import { Link } from 'react-router-dom';
import { ProductGrid, productStrings } from '@/entities/product';
import { useCurrentUser } from '@/entities/user';
import { VendorCard, vendorDirectoryStrings, useVendors } from '@/entities/vendor';
import { AddToCartButton } from '@/features/add-to-cart';
import { AreaPicker, areaStrings, useDeliveryArea } from '@/features/choose-delivery-area';
import {
  hasActiveFilters,
  matchesQuery,
  ProductFilterPanel,
  ProductToolbar,
  useProductSearch,
} from '@/features/filter-products';
import { useLoginRedirect } from '@/features/login';
import { routes } from '@/shared/config/routes';
import { ErrorState, LoadingState } from '@/shared/ui';

/** M2.0 "Mua hàng có sẵn": filters on the left, results on the right; a vendor block when `q` names one (AC-14.5). */
export function ProductListPage() {
  const session = useCurrentUser();
  const { area } = useDeliveryArea();
  const { all, filters, setFilters, results } = useProductSearch(area);
  const vendors = useVendors();
  const toLogin = useLoginRedirect();

  const matchingVendors =
    filters.query && vendors.kind === 'loaded' ? vendors.data.filter((s) => matchesQuery(s.name, filters.query)) : [];

  return (
    <div className="shop__inner page">
      <header className="page-head">
        <div>
          <h1 className="title-text">{filters.query ? productStrings.searchEcho(filters.query) : productStrings.listTitle}</h1>
          <div className="lead-text">
            {productStrings.listLead(area)} <AreaPicker variant="link" label={areaStrings.change} />
          </div>
        </div>
      </header>

      {matchingVendors.length > 0 && (
        <section className="panel vendor-match" aria-labelledby="vendor-match-heading">
          <div>
            <h2 id="vendor-match-heading" className="vendor-match__title">
              {vendorDirectoryStrings.matchTitle(filters.query)}
            </h2>
            <p className="muted">{vendorDirectoryStrings.matchNote}</p>
          </div>
          {matchingVendors.map((s) => (
            <VendorCard key={s.id} vendor={s} layout="row" />
          ))}
        </section>
      )}

      {all.kind === 'loading' && (
        <div className="listing" style={{ minHeight: 480 }}>
          <div className="panel" style={{ height: 320, opacity: 0.5 }} />
          <div className="listing__results">
            <LoadingState />
          </div>
        </div>
      )}
      {all.kind === 'error' && <ErrorState message={all.message} onRetry={all.reload} />}
      {all.kind === 'loaded' && (
        <div className="listing">
          <ProductFilterPanel products={all.data} filters={filters} onChange={setFilters} />
          <div className="listing__results">
            <ProductToolbar filters={filters} onChange={setFilters} />
            <p className="muted" aria-live="polite">
              {productStrings.count(results.length)}
            </p>
            {results.length > 0 ? (
              <ProductGrid
                products={results}
                renderAction={(p) => (
                  <AddToCartButton productId={p.id} productName={p.name} size="sm" loggedIn={Boolean(session)} onNeedLogin={toLogin} />
                )}
              />
            ) : (
              <div className="empty-state">
                <p className="empty-state__title">{productStrings.emptyTitle(area)}</p>
                <p className="muted">{productStrings.emptyBody}</p>
                <div className="row">
                  {hasActiveFilters(filters) && (
                    <Link to={routes.base.products} className="mk-btn mk-btn--quiet">
                      {productStrings.removeAll}
                    </Link>
                  )}
                  <Link to={routes.base.newQuoteRequest} className="mk-btn mk-btn--primary">
                    Tạo yêu cầu báo giá
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
