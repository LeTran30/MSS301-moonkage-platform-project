import { useState } from 'react';
import { useAdminProducts } from '@/entities/product';
import { ErrorState, LoadingState, PageHeader, Tabs } from '@/shared/ui';
import { formatVnd } from '@/shared/utils/money';
import { takeDownProduct } from '../api/takeDownApi';
import styles from './AdminProducts.module.css';

/** Q3.0 (simple): search products and take one down with a reason the vendor will read. */
export function AdminProducts() {
  const state = useAdminProducts();
  const [tab, setTab] = useState<'live' | 'removed'>('live');
  const [q, setQ] = useState('');
  const [reasons, setReasons] = useState<Record<string, string>>({});
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  const list = state.data.filter((p) => (tab === 'removed' ? p.removed : !p.removed) && p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="page">
      <PageHeader title="Sản phẩm" />
      <div className={styles.productToolbar}>
        <Tabs
          label="Trạng thái"
          current={tab}
          onChange={setTab}
          tabs={[
            { key: 'live', label: 'Đang bán' },
            { key: 'removed', label: 'Đã gỡ' },
          ]}
        />
        <div className={`mk-field ${styles.vendorSearch}`}>
          <label htmlFor="ap-q" className="mk-sr">
            Tìm sản phẩm
          </label>
          <input id="ap-q" type="search" placeholder="Tên sản phẩm" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th scope="col">Sản phẩm</th>
            <th scope="col">Shop</th>
            <th scope="col" className={styles.num}>
              Giá
            </th>
            <th scope="col">{tab === 'live' ? 'Gỡ' : 'Lý do gỡ'}</th>
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id}>
              <td>
                <strong>{p.name}</strong>
              </td>
              <td>{p.shop}</td>
              <td className={`${styles.num} mk-num`}>{formatVnd(p.price)}</td>
              <td>
                {p.removed ? (
                  <span className="muted">
                    {p.removed.at}: "{p.removed.reason}"
                  </span>
                ) : (
                  <div className="row">
                    <input
                      className={styles.cellInput}
                      aria-label={`Lý do gỡ ${p.name}`}
                      placeholder="Lý do gỡ"
                      value={reasons[p.id] ?? ''}
                      onChange={(e) => setReasons({ ...reasons, [p.id]: e.target.value })}
                    />
                    <button
                      type="button"
                      className="mk-btn mk-btn--quiet mk-btn--sm"
                      disabled={!reasons[p.id]?.trim()}
                      onClick={async () => {
                        await takeDownProduct(p.id, reasons[p.id].trim());
                        state.reload();
                      }}
                    >
                      Gỡ sản phẩm
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
