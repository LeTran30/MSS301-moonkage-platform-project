import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/config/routes';
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge, Tabs } from '@/shared/ui';
import type { ApplicationState } from '../model/applicationTypes';
import { applicationLabel, ownerMatch } from '../model/applicationsModel';
import { useApplications } from '../model/useApplications';
import styles from './VendorApplications.module.css';

const STATES: ApplicationState[] = ['pending', 'needs-more', 'approved', 'locked', 'rejected'];

/** Q2.0 */
export function VendorApplications() {
  const state = useApplications();
  const [tab, setTab] = useState<ApplicationState>('pending');
  const [q, setQ] = useState('');
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  const list = state.data.filter((a) => a.state === tab && `${a.shopName} ${a.regNo}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="page">
      <PageHeader title="Người bán" />
      <div className={styles.productToolbar}>
        <Tabs label="Trạng thái hồ sơ" current={tab} onChange={setTab} tabs={STATES.map((s) => ({ key: s, label: applicationLabel[s].label, count: state.data.filter((a) => a.state === s).length }))} />
        <div className={`mk-field ${styles.vendorSearch}`}>
          <label htmlFor="app-q" className="mk-sr">
            Tìm hồ sơ
          </label>
          <input id="app-q" type="search" placeholder="Tên đơn vị, mã đăng ký…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {list.length === 0 ? (
        <EmptyState title="Không có hồ sơ nào ở đây" />
      ) : (
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th scope="col">Đơn vị</th>
              <th scope="col">Loại hình</th>
              <th scope="col">So khớp chủ hộ</th>
              <th scope="col">Nộp</th>
              <th scope="col">
                <span className="mk-sr">Mở</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => {
              const m = ownerMatch(a);
              return (
                <tr key={a.id}>
                  <td>
                    <strong>{a.shopName}</strong>
                    <br />
                    <span className="muted">
                      {a.city} · {a.ways} · lần nộp {a.attempt}
                    </span>
                  </td>
                  <td>{a.kind}</td>
                  <td>
                    <StatusBadge tone={m.name && m.id ? 'ok' : 'warn'}>{m.name && m.id ? 'Khớp tên và số định danh' : 'Lệch số định danh'}</StatusBadge>
                  </td>
                  <td className="mk-num">
                    {a.submittedAt}
                    <br />
                    <span className="muted">{a.waiting}</span>
                  </td>
                  <td className={styles.actions}>
                    <Link to={routes.admin.vendor(a.id)} className="mk-btn mk-btn--quiet mk-btn--sm">
                      Xem hồ sơ
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

