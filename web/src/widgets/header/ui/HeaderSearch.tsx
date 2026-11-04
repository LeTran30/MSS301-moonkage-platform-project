import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Icon } from '@/shared/ui';
import styles from './Header.module.css';

/** Ô tìm kiếm của header (M1.0, FR-06). */
export function HeaderSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`${routes.base.catalog}?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate(routes.base.catalog);
    }
  }

  return (
    <form className={styles.searchForm} onSubmit={handleSearch} role="search">
      <Icon name="search" size={18} className={styles.searchIcon} />
      <input
        type="text"
        className={styles.searchInput}
        placeholder="Tìm theo loại bánh..."
        aria-label="Tìm theo loại bánh"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button type="submit" className={styles.searchSubmitBtn}>
        Tìm kiếm
      </button>
    </form>
  );
}
