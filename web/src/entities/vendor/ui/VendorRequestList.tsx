import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/config/routes';
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge, Tabs } from '@/shared/ui';
import { timeLeft, useIncomingRequests } from '../model/useIncomingRequests';
import styles from './VendorRequestList.module.css';

/** B3.0 */
export function VendorRequestList() {
  const state = useIncomingRequests();
  const [tab, setTab] = useState<'new' | 'quoted' | 'closed'>('new');
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  const list = state.data.filter((r) => (tab === 'closed' ? r.state === 'declined' || r.state === 'closed' : r.state === tab));
  return (
    <div className="page">
      <PageHeader title="Yêu cầu báo giá" />
      <Tabs
        label="Trạng thái"
        current={tab}
        onChange={setTab}
        tabs={[
          { key: 'new', label: 'Mới', count: state.data.filter((r) => r.state === 'new').length },
          { key: 'quoted', label: 'Đã báo giá' },
          { key: 'closed', label: 'Đã đóng' },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState title="Không có yêu cầu nào ở đây" />
      ) : (
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th scope="col">Yêu cầu</th>
              <th scope="col">Loại</th>
              <th scope="col">Người mua · giao tới</th>
              <th scope="col">Hạn trả lời</th>
              <th scope="col">
                <span className="mk-sr">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td>
                  <strong>
                    {r.id} · {r.boxes} hộp
                  </strong>
                  <br />
                  <span className="muted">{r.summary}</span>
                </td>
                <td>{r.invitation === 'open' ? 'Lời mời' : 'Gửi riêng cho bạn'}</td>
                <td>
                  {r.buyer}
                  <br />
                  <span className="muted">
                    {r.deliverTo} · trước {r.deliverBy}
                  </span>
                </td>
                <td>
                  <StatusBadge tone={r.hoursLeft > 0 && r.hoursLeft < 24 ? 'warn' : 'plain'}>{r.state === 'quoted' ? 'Đã gửi báo giá' : timeLeft(r.hoursLeft)}</StatusBadge>
                </td>
                <td className={styles.actions}>
                  <div className="row">
                    <Link to={routes.vendor.request(r.id)} className="mk-btn mk-btn--quiet mk-btn--sm">
                      Xem
                    </Link>
                    {r.state === 'new' && (
                      <Link to={routes.vendor.quote(r.id)} className="mk-btn mk-btn--primary mk-btn--sm">
                        Báo giá
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

