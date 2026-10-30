import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { routes } from '@/shared/config/routes';
import { searchStrings } from '../strings';
import styles from './ProductSearchBox.module.css';

/** DS search (mk-search) of the NavBar: goes to "Mua hàng có sẵn" with `q`; a vendor name also shows the vendor block. */
export function ProductSearchBox() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [text, setText] = useState(params.get('q') ?? '');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const q = text.trim();
    navigate(q ? `${routes.base.products}?q=${encodeURIComponent(q)}` : routes.base.products);
  };

  return (
    <form role="search" className={`${styles.search} mk-search`} onSubmit={submit}>
      <label htmlFor="site-search" className="mk-sr">
        {searchStrings.searchLabel}
      </label>
      <input
        id="site-search"
        type="search"
        className={styles.input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={searchStrings.searchPlaceholder}
      />
      <button type="submit" className={styles.button} aria-label={searchStrings.searchSubmit}>
        <svg className="mk-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
    </form>
  );
}
