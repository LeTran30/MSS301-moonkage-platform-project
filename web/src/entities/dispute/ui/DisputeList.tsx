import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/config/routes';
import { EmptyState, ErrorState, LoadingState, PageHeader, Tabs } from '@/shared/ui';
import { formatVnd } from '@/shared/utils/money';
import { useDisputes } from '../model/useDisputes';
import styles from './DisputeList.module.css';

/** Q5.0 */
export function DisputeList() {
  const state = useDisputes();
  const [tab, setTab] = useState<'open' | 'closed'>('open');
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  const list = state.data.filter((d) => (tab === 'open' ? d.state === 'open' : d.state !== 'open'));
  return (
    <div className="page">
      <PageHeader title="Khiếu nại" lead="Người mua và người bán chưa thống nhất được. Moonkage quyết định trên số tiền đang giữ." />
      <Tabs
        label="Trạng thái"
        current={tab}
        onChange={setTab}
        tabs={[
          { key: 'open', label: 'Đang mở', count: state.data.filter((d) => d.state === 'open').length },
          { key: 'closed', label: 'Đã đóng' },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState title="Không có khiếu nại nào" />
      ) : (
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th scope="col">Khiếu nại</th>
              <th scope="col">Lý do</th>
              <th scope="col">Người bán đề xuất</th>
              <th scope="col" className={styles.num}>
                Đang giữ
              </th>
              <th scope="col">
                <span className="mk-sr">Mở</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.id}>
                <td>
                  <strong className="mk-num">{d.id}</strong> · đơn {d.orderId}
                  <br />
                  <span className="muted">
                    {d.buyer} ↔ {d.vendor} · mở {d.openedAt}
                  </span>
                </td>
                <td>{d.reason}</td>
                <td>{d.vendorProposal ? `${d.vendorProposal.kind} ${formatVnd(d.vendorProposal.amount)}` : <span className="muted">Chưa có</span>}</td>
                <td className={`${styles.num} mk-num`}>{formatVnd(d.held)}</td>
                <td className={styles.actions}>
                  <Link to={routes.admin.dispute(d.id)} className="mk-btn mk-btn--quiet mk-btn--sm">
                    {d.state === 'open' ? 'Xử lý' : 'Xem'}
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
