import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/config/routes';
import { EmptyState, ErrorState, LoadingState, StatusBadge, Tabs } from '@/shared/ui';
import { formatVnd } from '@/shared/utils/money';
import type { CustomOrder, ReadyStatus } from '../model/types';
import { customStatus, groupByPayment, readyStatusLabel, readyTotal } from '../model/orderModel';
import { useOrders } from '../model/useOrders';
import styles from './OrderList.module.css';

type Kind = 'ready' | 'custom';
type Filter = 'all' | ReadyStatus;

/** M6.1: ready-made orders grouped by payment, custom orders as a table. */
export function OrderList() {
  const state = useOrders();
  const [kind, setKind] = useState<Kind>('ready');
  const [filter, setFilter] = useState<Filter>('all');

  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;

  const groups = groupByPayment(state.data)
    .map((g) => ({ ...g, orders: g.orders.filter((o) => filter === 'all' || o.status === filter) }))
    .filter((g) => g.orders.length);
  const custom = state.data.filter((o): o is CustomOrder => o.kind === 'custom');

  return (
    <div className="stack">
      <Tabs
        label="Loại đơn"
        current={kind}
        onChange={setKind}
        tabs={[
          { key: 'ready', label: 'Mua hàng có sẵn' },
          { key: 'custom', label: 'Đặt theo yêu cầu', count: custom.length },
        ]}
      />

      {kind === 'ready' && (
        <>
          <div className={`${styles.filterRow} filter-row`} role="group" aria-label="Trạng thái">
            {(['all', 'pending', 'shipping', 'delivered', 'cancelled'] as Filter[]).map((f) => (
              <button key={f} type="button" className="mk-btn mk-btn--text" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Tất cả' : readyStatusLabel[f].label}
              </button>
            ))}
          </div>
          {groups.length === 0 ? (
            <EmptyState title="Chưa có đơn nào" body="Đơn sẽ hiện ở đây sau khi bạn thanh toán.">
              <Link to={routes.base.products} className="mk-btn mk-btn--primary">
                Xem hàng có sẵn
              </Link>
            </EmptyState>
          ) : (
            groups.map((g) => (
              <section key={g.paymentId} className={`${styles.paymentGroup} payment-group`} aria-label={`Lần thanh toán ${g.paymentId}`}>
                <p className={`${styles.paymentHead} payment-group__head muted mk-num`}>
                  Lần thanh toán {g.paymentId} · {g.placedAt} · {formatVnd(g.total)}
                </p>
                <ul className={`${styles.rowList} row-list`}>
                  {g.orders.map((o) => (
                    <li key={o.id} className={`${styles.rowItem} row-list__item`}>
                      <div className={`${styles.rowMain} row-list__main`}>
                        <p className={`${styles.rowTitle} row-list__title`}>
                          {o.id} · {o.shop}
                        </p>
                        <p className="muted">
                          {o.lines.map((l) => `${l.name} × ${l.quantity}`).join(', ')}
                          {o.deliveredAt ? ` · đã giao ${o.deliveredAt}` : ''}
                        </p>
                      </div>
                      <StatusBadge tone={readyStatusLabel[o.status].tone}>{readyStatusLabel[o.status].label}</StatusBadge>
                      <span className="mk-price">{formatVnd(readyTotal(o))}</span>
                      <Link to={routes.account.order(o.id)} className="mk-btn mk-btn--quiet mk-btn--sm">
                        Xem
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </>
      )}

      {kind === 'custom' &&
        (custom.length === 0 ? (
          <EmptyState title="Chưa có đơn đặt hàng" body="Đơn được tạo khi bạn chấp nhận một báo giá và đặt cọc." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Đơn</th>
                <th scope="col">Đơn vị</th>
                <th scope="col">Đang ở bước</th>
                <th scope="col" className="num">
                  Giá trị
                </th>
                <th scope="col">
                  <span className="mk-sr">Mở</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {custom.map((o) => {
                const s = customStatus(o);
                return (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.id}</strong>
                      <br />
                      <span className="muted">{o.title}</span>
                    </td>
                    <td>{o.vendorName}</td>
                    <td>
                      <StatusBadge tone={s.tone}>{s.label}</StatusBadge>
                    </td>
                    <td className="num mk-num">{formatVnd(o.value)}</td>
                    <td className="actions">
                      <Link to={routes.account.order(o.id)} className="mk-btn mk-btn--quiet mk-btn--sm">
                        Xem
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ))}
    </div>
  );
}
