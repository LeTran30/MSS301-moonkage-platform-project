import { useState } from 'react';
import { Link } from 'react-router-dom';
import { filterSuppliers, SupplierCard, supplierStrings, useSuppliers, type SupplierKind } from '../../features/suppliers';
import { routes } from '../../shared/config/routes';
import { strings } from '../../shared/config/strings';
import { ErrorState, LoadingState } from '../../shared/ui';

/** M3.2: every supplier taking custom orders, searchable by name, with kind chips. */
export function SupplierListPage() {
  const suppliers = useSuppliers();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<SupplierKind>('all');
  const list = suppliers.kind === 'loaded' ? filterSuppliers(suppliers.data, query, kind) : [];

  return (
    <div className="shop__inner page">
      <header className="page-head">
        <div>
          <h1 className="title-text">{supplierStrings.listTitle}</h1>
          <p className="lead-text">{supplierStrings.listLead}</p>
        </div>
        <Link to={routes.newQuoteRequest} className="mk-btn mk-btn--primary">
          {strings.nav.newQuoteRequest}
        </Link>
      </header>

      <div className="product-toolbar">
        <div className="mk-field supplier-search">
          <label htmlFor="supplier-q" className="mk-sr">
            {supplierStrings.searchLabel}
          </label>
          <input id="supplier-q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={supplierStrings.searchPlaceholder} />
        </div>
        <div className="product-toolbar__chips" role="group" aria-label="Loại đơn vị">
          {(Object.keys(supplierStrings.kinds) as SupplierKind[]).map((k) => (
            <button key={k} type="button" className="mk-chip" aria-pressed={kind === k} onClick={() => setKind(k)}>
              {supplierStrings.kinds[k]}
            </button>
          ))}
        </div>
      </div>

      {suppliers.kind === 'loading' && <LoadingState />}
      {suppliers.kind === 'error' && <ErrorState message={suppliers.message} onRetry={suppliers.reload} />}
      {suppliers.kind === 'loaded' && (
        <>
          <p className="muted" aria-live="polite">
            {supplierStrings.count(list.length)}
          </p>
          {list.length ? (
            <ul className="stack">
              {list.map((s) => (
                <li key={s.id}>
                  <SupplierCard supplier={s} layout="row" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{supplierStrings.empty}</p>
          )}
        </>
      )}
    </div>
  );
}
