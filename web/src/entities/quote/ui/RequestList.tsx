import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/config/routes';
import { EmptyState, ErrorState, LoadingState, StatusBadge, Tabs } from '@/shared/ui';
import { requestStatusLabel, requestTitle } from '../model/quoteModel';
import type { RequestStatus } from '../model/types';
import { useRequests } from '../model/useQuotes';
import styles from './RequestList.module.css';

const ORDER: RequestStatus[] = ['new-quotes', 'waiting', 'accepted', 'closed'];

/** M6.2: the buyer's requests by state. */
export function RequestList() {
  const state = useRequests();
  const [tab, setTab] = useState<'open' | RequestStatus>('open');
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;

  const isOpen = (s: RequestStatus) => s === 'waiting' || s === 'new-quotes';
  const list = state.data.filter((r) => (tab === 'open' ? isOpen(r.status) : r.status === tab));
  const count = (f: (s: RequestStatus) => boolean) => state.data.filter((r) => f(r.status)).length;

  return (
    <div className="stack">
      <Tabs
        label="Trạng thái yêu cầu"
        current={tab}
        onChange={setTab}
        tabs={[
          { key: 'open', label: 'Đang mở', count: count(isOpen) },
          { key: 'new-quotes', label: 'Có báo giá mới', count: count((s) => s === 'new-quotes') },
          { key: 'accepted', label: 'Đã chốt' },
          { key: 'closed', label: 'Đã đóng' },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState title="Không có yêu cầu nào ở đây" body="Tạo yêu cầu báo giá để các đơn vị gửi giá cho bạn." />
      ) : (
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th scope="col">Yêu cầu</th>
              <th scope="col">Loại</th>
              <th scope="col" className={styles.num}>
                Mời / Báo giá
              </th>
              <th scope="col">Trạng thái</th>
              <th scope="col">
                <span className="mk-sr">Mở</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {[...list]
              .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status))
              .map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>
                      {r.id} · {requestTitle(r)}
                    </strong>
                    <br />
                    <span className="muted">Tạo {r.createdAt}</span>
                  </td>
                  <td>{r.kind === 'open' ? 'Gửi nhiều nơi' : `Gửi riêng ${r.directTo}`}</td>
                  <td className={`${styles.num} mk-num`}>
                    {r.invited.length} / {r.quotes.length}
                  </td>
                  <td>
                    <StatusBadge tone={requestStatusLabel[r.status].tone}>{requestStatusLabel[r.status].label}</StatusBadge>
                  </td>
                  <td className={styles.actions}>
                    <Link to={routes.account.quoteRequest(r.id)} className="mk-btn mk-btn--quiet mk-btn--sm">
                      {r.quotes.length > 1 && r.status === 'new-quotes' ? 'So sánh' : 'Xem'}
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
