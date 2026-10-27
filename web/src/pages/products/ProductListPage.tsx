import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { AddToCartButton } from '../../features/cart';
import {
  catalogStrings,
  hasActiveFilters,
  matchesQuery,
  ProductFilterPanel,
  ProductGrid,
  ProductToolbar,
  useProductSearch,
} from '../../features/catalog';
import { AreaPicker, areaStrings, useDeliveryArea } from '../../features/delivery-area';
import { SupplierCard, supplierStrings, useSuppliers } from '../../features/suppliers';
import { routes } from '../../shared/config/routes';
import { strings } from '../../shared/config/strings';
import { ErrorState, LoadingState } from '../../shared/ui';
import { useLoginRedirect } from '../useLoginRedirect';

/** M2.0 "Mua hàng có sẵn": filters on the left, results on the right; a supplier block when `q` names one (AC-14.5). */
export function ProductListPage() {
  const { session } = useAuth();
  const { area } = useDeliveryArea();
  const { all, filters, setFilters, results } = useProductSearch(area);
  const suppliers = useSuppliers();
  const toLogin = useLoginRedirect();

  const matchingSuppliers =
    filters.query && suppliers.kind === 'loaded' ? suppliers.data.filter((s) => matchesQuery(s.name, filters.query)) : [];

  return (
    <div className="shop__inner page">
      <header className="page-head">
        <div>
          <h1 className="title-text">{filters.query ? catalogStrings.searchEcho(filters.query) : catalogStrings.listTitle}</h1>
          <p className="lead-text">
            {catalogStrings.listLead(area)} <AreaPicker variant="link" label={areaStrings.change} />
          </p>
        </div>
      </header>

      {matchingSuppliers.length > 0 && (
        <section className="panel supplier-match" aria-labelledby="supplier-match-heading">
          <div>
            <h2 id="supplier-match-heading" className="supplier-match__title">
              {supplierStrings.matchTitle(filters.query)}
            </h2>
            <p className="muted">{supplierStrings.matchNote}</p>
          </div>
          {matchingSuppliers.map((s) => (
            <SupplierCard key={s.id} supplier={s} layout="row" />
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
              {catalogStrings.count(results.length)}
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
                <p className="empty-state__title">{catalogStrings.emptyTitle(area)}</p>
                <p className="muted">{catalogStrings.emptyBody}</p>
                <div className="row">
                  {hasActiveFilters(filters) && (
                    <Link to={routes.products} className="mk-btn mk-btn--quiet">
                      {catalogStrings.removeAll}
                    </Link>
                  )}
                  <Link to={routes.newQuoteRequest} className="mk-btn mk-btn--primary">
                    {strings.nav.newQuoteRequest}
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
