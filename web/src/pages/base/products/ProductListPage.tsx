import { Link } from 'react-router-dom';
import { ProductGrid, productStrings, useCakeAttributeLabels } from '@/entities/product';
import { useCurrentUser } from '@/entities/user';
import { VendorCard, vendorDirectoryStrings, useVendors } from '@/entities/vendor';
import { AddToCartButton } from '@/features/add-to-cart';
import { AreaPicker, areaStrings, useDeliveryArea } from '@/features/choose-delivery-area';
import {
  filterStrings,
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
  const { filters, setFilters, results, facets, loadMore, reload } = useProductSearch(area);
  const attributes = useCakeAttributeLabels();
  const labels = attributes.kind === 'loaded' ? attributes.data : undefined;
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

      {facets.kind === 'loading' && (
        <div className="listing" style={{ minHeight: 480 }}>
          <div className="panel" style={{ height: 320, opacity: 0.5 }} />
          <div className="listing__results">
            <LoadingState />
          </div>
        </div>
      )}
      {facets.kind === 'error' && <ErrorState message={facets.message} onRetry={facets.reload} />}
      {facets.kind === 'loaded' && (
        <div className="listing">
          <ProductFilterPanel facets={facets.data} labels={labels} filters={filters} onChange={setFilters} />
          <div className="listing__results">
            <ProductToolbar filters={filters} facets={facets.data} labels={labels} onChange={setFilters} />
            {results.kind === 'loading' && <LoadingState />}
            {results.kind === 'error' && <ErrorState message={results.message} onRetry={reload} />}
            {results.kind === 'loaded' && (
              <p className="muted" aria-live="polite">
                {productStrings.count(results.total)}
              </p>
            )}
            {results.kind === 'loaded' && results.items.length > 0 && (
              <>
                <ProductGrid
                  products={results.items}
                  renderAction={(p) => (
                    <AddToCartButton productId={p.id} productName={p.name} size="sm" loggedIn={Boolean(session)} onNeedLogin={toLogin} />
                  )}
                />
                {results.items.length < results.total && (
                  <div className="row">
                    <button type="button" className="mk-btn mk-btn--quiet" onClick={loadMore} disabled={results.loadingMore}>
                      {results.loadingMore ? filterStrings.loadingMore : filterStrings.loadMore}
                    </button>
                  </div>
                )}
              </>
            )}
            {results.kind === 'loaded' && results.items.length === 0 && (
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
