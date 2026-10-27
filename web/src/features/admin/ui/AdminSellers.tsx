import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { EmptyState, ErrorState, KeyValue, LoadingState, PageHeader, SectionTabs, StatusBadge, Tabs, TaskList } from '../../../shared/ui';
import { formatVnd } from '../../../shared/utils/money';
import { applicationLabel, ownerMatch } from '../model/adminModel';
import {
  decideApplication,
  takeDownProduct,
  useAdminProducts,
  useApplications,
  useDisbursementRequests,
  useDisputes,
  usePayouts,
  type ApplicationState,
  type SellerApplication,
} from '../model/useAdmin';

/** Q1.0: the queues, oldest first. */
export function AdminOverview() {
  const apps = useApplications();
  const dis = useDisbursementRequests();
  const pay = usePayouts();
  const disputes = useDisputes();
  if ([apps, dis, pay, disputes].some((s) => s.kind === 'loading')) return <LoadingState />;
  const pending = apps.kind === 'loaded' ? apps.data.filter((a) => a.state === 'pending') : [];
  const waitingDis = dis.kind === 'loaded' ? dis.data.filter((d) => d.state === 'waiting') : [];
  const toPay = pay.kind === 'loaded' ? pay.data.filter((p) => !p.paid && !p.blocked) : [];
  const open = disputes.kind === 'loaded' ? disputes.data.filter((d) => d.state === 'open') : [];
  const tiles = [
    { label: 'Hồ sơ người bán chờ duyệt', n: pending.length, to: routes.adminSellers, go: 'Người bán' },
    { label: 'Giải ngân cọc chờ duyệt', n: waitingDis.length, to: routes.adminDisbursements, go: 'Duyệt giải ngân' },
    { label: 'Đơn chờ chuyển tiền', n: toPay.length, to: routes.adminPayouts, go: 'Chuyển tiền' },
    { label: 'Khiếu nại đang mở', n: open.length, to: routes.adminDisputes, go: 'Khiếu nại' },
  ];
  return (
    <div className="page">
      <PageHeader title="Tổng quan" lead="Hàng chờ xử lý, cũ nhất trước." />
      <div className="stat-grid stat-grid--4">
        {tiles.map((t) => (
          <Link key={t.label} to={t.to} className="stat-tile">
            <span className="muted">{t.label}</span>
            <span className="stat-tile__num mk-num">{t.n}</span>
            <span className="stat-tile__go">{t.go}</span>
          </Link>
        ))}
      </div>
      <section className="stack" aria-labelledby="oldest">
        <h2 id="oldest" className="detail-heading">
          Cũ nhất trong hàng chờ
        </h2>
        <p className="muted">Xử lý từ trên xuống.</p>
        <TaskList
          empty="Hàng chờ trống."
          tasks={[
            ...open.map((d) => ({ id: d.id, tag: 'Khiếu nại', title: `${d.id} · đơn ${d.orderId}${d.sellerProposal ? ' · người bán đã đề xuất' : ''}`, meta: `mở ${d.openedAt}`, to: routes.adminDispute(d.id), action: 'Xử lý', primary: true })),
            ...pending.map((a) => ({ id: a.id, tag: 'Hồ sơ', title: `${a.shopName} · ${a.kind.toLowerCase()}`, meta: a.waiting, to: routes.adminSeller(a.id), action: 'Xử lý' })),
            ...waitingDis.map((d) => ({ id: d.id, tag: 'Giải ngân', title: `${d.orderId} · ${formatVnd(d.amount)}`, meta: `xin ${d.askedAt}`, to: routes.adminDisbursements, action: 'Xử lý' })),
          ]}
        />
      </section>
      <section className="panel panel--wide" aria-labelledby="flag">
        <h2 id="flag" className="detail-heading">
          Đơn bị đánh dấu đối soát <span className="mk-badge mk-badge--brand">1</span>
        </h2>
        <div className="row-between">
          <span>MK-8702 · tiền VNPay báo về khác số tiền đơn 25.000đ</span>
          <Link to={routes.adminReconciliation} className="mk-btn mk-btn--quiet mk-btn--sm">
            Xem đối soát
          </Link>
        </div>
      </section>
    </div>
  );
}

const STATES: ApplicationState[] = ['pending', 'needs-more', 'approved', 'locked', 'rejected'];

/** Q2.0 */
export function SellerApplications() {
  const state = useApplications();
  const [tab, setTab] = useState<ApplicationState>('pending');
  const [q, setQ] = useState('');
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  const list = state.data.filter((a) => a.state === tab && `${a.shopName} ${a.regNo}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="page">
      <PageHeader title="Người bán" />
      <div className="product-toolbar">
        <Tabs label="Trạng thái hồ sơ" current={tab} onChange={setTab} tabs={STATES.map((s) => ({ key: s, label: applicationLabel[s].label, count: state.data.filter((a) => a.state === s).length }))} />
        <div className="mk-field supplier-search">
          <label htmlFor="app-q" className="mk-sr">
            Tìm hồ sơ
          </label>
          <input id="app-q" type="search" placeholder="Tên đơn vị, mã đăng ký…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {list.length === 0 ? (
        <EmptyState title="Không có hồ sơ nào ở đây" />
      ) : (
        <table className="data-table">
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
                  <td className="actions">
                    <Link to={routes.adminSeller(a.id)} className="mk-btn mk-btn--quiet mk-btn--sm">
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

/** Q2.1: the owner check, the documents, and the decision (approve, ask for more, refuse, lock). */
export function ApplicationReview({ app, onChanged }: { app: SellerApplication; onChanged: () => void }) {
  const [tab, setTab] = useState<'profile' | 'history'>('profile');
  const [checked, setChecked] = useState(false);
  const [more, setMore] = useState('');
  const [refuse, setRefuse] = useState('');
  const m = ownerMatch(app);
  const label = applicationLabel[app.state];
  const decide = async (state: ApplicationState, note?: string) => {
    await decideApplication(app.id, state, note);
    onChanged();
  };
  return (
    <div className="page">
      <PageHeader
        eyebrow={`Hồ sơ người bán · lần nộp ${app.attempt}`}
        title={
          <>
            {app.shopName} <StatusBadge tone={label.tone}>{label.label}</StatusBadge>
          </>
        }
        lead={`${app.kind} · ${app.city} · nộp ${app.submittedAt}`}
      />
      <div className="detail-layout">
        <SectionTabs
          current={tab}
          onChange={setTab}
          tabs={[
            { key: 'profile', label: 'Hồ sơ' },
            { key: 'history', label: `Lịch sử ${app.history.length}` },
          ]}
        >
          {tab === 'profile' ? (
            <div className="stack">
              <h2 className="detail-heading">So khớp chủ hộ (tự động)</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col" />
                    <th scope="col">Trên giấy đăng ký</th>
                    <th scope="col">Từ chip CCCD</th>
                    <th scope="col">Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Họ tên</th>
                    <td>{app.ownerOnPaper.name}</td>
                    <td>{app.ownerOnChip.name}</td>
                    <td>
                      <StatusBadge tone={m.name ? 'ok' : 'warn'}>{m.name ? 'Khớp' : 'Lệch'}</StatusBadge>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Số định danh</th>
                    <td className="mk-num">{app.ownerOnPaper.id}</td>
                    <td className="mk-num">{app.ownerOnChip.id}</td>
                    <td>
                      <StatusBadge tone={m.id ? 'ok' : 'warn'}>{m.id ? 'Khớp' : 'Lệch'}</StatusBadge>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="grid-2">
                {['Giấy đăng ký kinh doanh', 'Giấy an toàn thực phẩm'].map((d) => (
                  <div key={d} className="doc-tile">
                    <div className="mockup__frame">{d}</div>
                    <button type="button" className="mk-btn mk-btn--text">
                      Xem tệp gốc
                    </button>
                  </div>
                ))}
              </div>
              <KeyValue
                rows={[
                  { label: 'Mã đăng ký', value: app.regNo },
                  { label: 'Địa chỉ', value: app.address },
                  { label: 'Nguồn hàng', value: app.source },
                  { label: 'Cách bán', value: app.ways },
                ]}
              />
            </div>
          ) : (
            <KeyValue rows={app.history.map((h) => ({ label: h.at, value: h.label }))} />
          )}
        </SectionTabs>
        <aside className="action-box" aria-labelledby="decide-heading">
          <h2 id="decide-heading" className="card-title-text">
            Quyết định
          </h2>
          {app.state === 'pending' ? (
            <>
              <label className="check">
                <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} /> Tôi đã đối chiếu giấy tờ gốc với thông tin khai
              </label>
              <button type="button" className="mk-btn mk-btn--primary mk-btn--block" disabled={!checked} onClick={() => decide('approved')}>
                Duyệt
              </button>
              <div className="mk-field">
                <label htmlFor="more">Yêu cầu bổ sung</label>
                <textarea id="more" className="textarea" rows={2} value={more} onChange={(e) => setMore(e.target.value)} placeholder="Ảnh giấy đăng ký rõ hơn, thấy đủ 4 góc." />
              </div>
              <button type="button" className="mk-btn mk-btn--quiet mk-btn--block" disabled={!more.trim()} onClick={() => decide('needs-more', more.trim())}>
                Gửi yêu cầu bổ sung
              </button>
              <div className="mk-field">
                <label htmlFor="refuse">Từ chối</label>
                <textarea id="refuse" className="textarea" rows={2} value={refuse} onChange={(e) => setRefuse(e.target.value)} placeholder="Lý do người bán sẽ đọc" />
              </div>
              <button type="button" className="mk-btn mk-btn--quiet mk-btn--block" disabled={!refuse.trim()} onClick={() => decide('rejected', refuse.trim())}>
                Từ chối hồ sơ
              </button>
            </>
          ) : (
            <>
              <p>Hồ sơ đang ở trạng thái: {label.label.toLowerCase()}.</p>
              {app.state === 'approved' && (
                <button type="button" className="mk-btn mk-btn--quiet mk-btn--block" onClick={() => decide('locked', 'Khóa bởi quản trị')}>
                  Khóa người bán
                </button>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

/** Q3.0 (simple): search products and take one down with a reason the seller will read. */
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
      <div className="product-toolbar">
        <Tabs
          label="Trạng thái"
          current={tab}
          onChange={setTab}
          tabs={[
            { key: 'live', label: 'Đang bán' },
            { key: 'removed', label: 'Đã gỡ' },
          ]}
        />
        <div className="mk-field supplier-search">
          <label htmlFor="ap-q" className="mk-sr">
            Tìm sản phẩm
          </label>
          <input id="ap-q" type="search" placeholder="Tên sản phẩm" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Sản phẩm</th>
            <th scope="col">Shop</th>
            <th scope="col" className="num">
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
              <td className="num mk-num">{formatVnd(p.price)}</td>
              <td>
                {p.removed ? (
                  <span className="muted">
                    {p.removed.at}: "{p.removed.reason}"
                  </span>
                ) : (
                  <div className="row">
                    <input
                      className="cell-input"
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
