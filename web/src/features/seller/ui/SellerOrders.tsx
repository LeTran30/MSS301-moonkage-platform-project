import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge, Tabs } from '../../../shared/ui';
import { formatVnd } from '../../../shared/utils/money';
import type { SellerCustomOrder, SellerReadyOrder } from '../api/types';
import { customStepLabel, goods, inTab, orderStatusLabel, type OrderTab } from '../model/sellerModel';
import { useSellerOrders } from '../model/useSeller';

const TABS: { key: OrderTab; label: string }[] = [
  { key: 'todo', label: 'Cần làm' },
  { key: 'shipping', label: 'Đang giao' },
  { key: 'delivered', label: 'Đã giao' },
  { key: 'no-invoice', label: 'Chưa có hóa đơn' },
  { key: 'complaint', label: 'Đang khiếu nại' },
];

/** B2.0: shop orders by what to do, custom orders as a table. */
export function SellerOrders() {
  const state = useSellerOrders();
  const [kind, setKind] = useState<'ready' | 'custom'>('ready');
  const [tab, setTab] = useState<OrderTab>('todo');
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  const ready = state.data.filter((o): o is SellerReadyOrder => o.kind === 'ready');
  const custom = state.data.filter((o): o is SellerCustomOrder => o.kind === 'custom');
  const list = ready.filter((o) => inTab(o, tab));

  return (
    <div className="page">
      <PageHeader title="Đơn hàng" />
      <Tabs
        label="Loại đơn"
        current={kind}
        onChange={setKind}
        tabs={[
          { key: 'ready', label: 'Đơn Shop', count: ready.length },
          { key: 'custom', label: 'Đơn đặt hàng', count: custom.length },
        ]}
      />
      {kind === 'ready' ? (
        <>
          <div className="filter-row" role="group" aria-label="Lọc đơn">
            {TABS.map((t) => (
              <button key={t.key} type="button" className="mk-btn mk-btn--text" aria-pressed={tab === t.key} onClick={() => setTab(t.key)}>
                {t.label} <span className="mk-num">({ready.filter((o) => inTab(o, t.key)).length})</span>
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <EmptyState title="Không có đơn nào ở đây" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Đơn</th>
                  <th scope="col">Người mua · giao tới</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col" className="num">
                    Tiền hàng
                  </th>
                  <th scope="col">
                    <span className="mk-sr">Mở</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.id}</strong>
                      <br />
                      <span className="muted">
                        {o.placedAt} · {o.lines.reduce((n, l) => n + l.quantity, 0)} món
                      </span>
                    </td>
                    <td>
                      {o.buyer} · {o.deliverTo}
                    </td>
                    <td>
                      <div className="row">
                        <StatusBadge tone={orderStatusLabel[o.status].tone}>{orderStatusLabel[o.status].label}</StatusBadge>
                        {o.complaint && <StatusBadge tone="warn">Đang khiếu nại</StatusBadge>}
                      </div>
                    </td>
                    <td className="num mk-num">{formatVnd(goods(o))}</td>
                    <td className="actions">
                      <Link to={routes.sellerOrder(o.id)} className={`mk-btn mk-btn--sm ${o.status === 'new' || (o.complaint && !o.complaint.proposal) ? 'mk-btn--primary' : 'mk-btn--quiet'}`}>
                        {o.complaint && !o.complaint.proposal ? 'Phản hồi' : o.status === 'new' ? 'Xử lý' : 'Xem'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Đơn</th>
              <th scope="col">Người mua</th>
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
            {custom.map((o) => (
              <tr key={o.id}>
                <td>
                  <strong>{o.id}</strong>
                  <br />
                  <span className="muted">{o.title}</span>
                </td>
                <td>{o.buyer}</td>
                <td>
                  <StatusBadge tone={o.feedback ? 'warn' : 'soft'}>{o.feedback ? 'Sửa maket theo góp ý' : customStepLabel[o.step]}</StatusBadge>
                </td>
                <td className="num mk-num">{formatVnd(o.value)}</td>
                <td className="actions">
                  <Link to={routes.sellerOrder(o.id)} className="mk-btn mk-btn--primary mk-btn--sm">
                    Xử lý
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
