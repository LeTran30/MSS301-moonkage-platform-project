import { useState } from 'react';
import { Link } from 'react-router-dom';
import { filterVendors, VendorCard, vendorDirectoryStrings, useVendors, type VendorKind } from '@/entities/vendor';
import { routes } from '@/shared/config/routes';
import { ErrorState, LoadingState } from '@/shared/ui';

/** M3.2: every vendor taking custom orders, searchable by name, with kind chips. */
export function VendorDirectoryPage() {
  const vendors = useVendors();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<VendorKind>('all');
  const list = vendors.kind === 'loaded' ? filterVendors(vendors.data, query, kind) : [];

  return (
    <div className="shop__inner page">
      <header className="page-head">
        <div>
          <h1 className="title-text">{vendorDirectoryStrings.listTitle}</h1>
          <p className="lead-text">{vendorDirectoryStrings.listLead}</p>
        </div>
        <Link to={routes.base.newQuoteRequest} className="mk-btn mk-btn--primary">
          Tạo yêu cầu báo giá
        </Link>
      </header>

      <div className="product-toolbar">
        <div className="mk-field vendor-search">
          <label htmlFor="vendor-q" className="mk-sr">
            {vendorDirectoryStrings.searchLabel}
          </label>
          <input id="vendor-q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={vendorDirectoryStrings.searchPlaceholder} />
        </div>
        <div className="product-toolbar__chips" role="group" aria-label="Loại đơn vị">
          {(Object.keys(vendorDirectoryStrings.kinds) as VendorKind[]).map((k) => (
            <button key={k} type="button" className="mk-chip" aria-pressed={kind === k} onClick={() => setKind(k)}>
              {vendorDirectoryStrings.kinds[k]}
            </button>
          ))}
        </div>
      </div>

      {vendors.kind === 'loading' && <LoadingState />}
      {vendors.kind === 'error' && <ErrorState message={vendors.message} onRetry={vendors.reload} />}
      {vendors.kind === 'loaded' && (
        <>
          <p className="muted" aria-live="polite">
            {vendorDirectoryStrings.count(list.length)}
          </p>
          {list.length ? (
            <ul className="stack">
              {list.map((s) => (
                <li key={s.id}>
                  <VendorCard vendor={s} layout="row" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{vendorDirectoryStrings.empty}</p>
          )}
        </>
      )}
    </div>
  );
}
