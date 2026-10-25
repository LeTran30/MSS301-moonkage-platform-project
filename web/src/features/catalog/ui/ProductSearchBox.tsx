import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { catalogStrings } from '../strings';

/** DS search (mk-search) of the NavBar: goes to "Mua hàng có sẵn" with `q`; a supplier name also shows the supplier block. */
export function ProductSearchBox() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [text, setText] = useState(params.get('q') ?? '');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const q = text.trim();
    navigate(q ? `${routes.products}?q=${encodeURIComponent(q)}` : routes.products);
  };

  return (
    <form role="search" className="mk-search" onSubmit={submit}>
      <label htmlFor="site-search" className="mk-sr">
        {catalogStrings.searchLabel}
      </label>
      <input id="site-search" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={catalogStrings.searchPlaceholder} />
      <button type="submit" aria-label={catalogStrings.searchSubmit}>
        <svg className="mk-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
    </form>
  );
}
