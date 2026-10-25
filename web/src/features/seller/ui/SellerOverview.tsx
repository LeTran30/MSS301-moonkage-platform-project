import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { PageHeader, StatusBadge, Steps, TaskList, type Task } from '../../../shared/ui';
import { resubmitProfile } from '../api/sellerApi';
import type { SellerOrder, SellerProfile } from '../api/types';
import { sellerTodo } from '../model/sellerModel';

const ONBOARDING = ['Nộp hồ sơ', 'Moonkage duyệt', 'Đóng phí 200.000đ', 'Cài vùng giao, đăng sản phẩm'];

/** B1.0: before opening, only the profile and the fee; after, what needs doing now. */
export function SellerOverview({
  profile,
  orders,
  newRequests,
  onChanged,
}: {
  profile: SellerProfile;
  orders: SellerOrder[];
  newRequests: number;
  onChanged: () => void;
}) {
  if (profile.state !== 'open') {
    const step = profile.state === 'approved' ? 2 : 1;
    return (
      <div className="page">
        <PageHeader title="Tổng quan" lead={`${profile.shopName} · hồ sơ nộp ${profile.submittedAt}`} />
        <Steps label="Mở bán" steps={ONBOARDING} current={step} />
        <section className="panel panel--wide" aria-labelledby="state-heading">
          <span className="eyebrow">Hồ sơ người bán</span>
          {profile.state === 'pending' && (
            <>
              <h2 id="state-heading" className="detail-heading">
                Đang chờ duyệt
              </h2>
              <p>Moonkage đang đối chiếu giấy tờ với CCCD của bạn, thường trong 1–2 ngày làm việc. Chưa cần làm gì thêm.</p>
            </>
          )}
          {profile.state === 'needs-more' && (
            <>
              <h2 id="state-heading" className="detail-heading">
                Cần bổ sung
              </h2>
              <p className="notice">Moonkage cần: {profile.moreNeeded}</p>
              <div className="row">
                <Link to={routes.sellerLegal} className="mk-btn mk-btn--quiet">
                  Xem hồ sơ đã nộp
                </Link>
                <button
                  type="button"
                  className="mk-btn mk-btn--primary"
                  onClick={async () => {
                    await resubmitProfile();
                    onChanged();
                  }}
                >
                  Nộp lại
                </button>
              </div>
            </>
          )}
          {profile.state === 'rejected' && (
            <>
              <h2 id="state-heading" className="detail-heading">
                Hồ sơ bị từ chối
              </h2>
              <p className="notice">Lý do: {profile.moreNeeded}</p>
              <p className="muted">Liên hệ đội vận hành Moonkage nếu bạn cần giải thích thêm.</p>
            </>
          )}
          {profile.state === 'approved' && (
            <>
              <h2 id="state-heading" className="detail-heading">
                Đã duyệt · còn đóng phí mở bán
              </h2>
              <p>Đóng phí 200.000đ để mở Đơn hàng, Sản phẩm, Tiền.</p>
              <Link to={routes.sellerFee} className="mk-btn mk-btn--primary">
                Đóng phí mở bán
              </Link>
            </>
          )}
        </section>
        {profile.state === 'pending' && (
          <p className="muted">
            Trong lúc chờ: <Link to={routes.sellerLegal}>Xem hồ sơ đã nộp</Link> · <Link to={routes.sellerSettings}>Cài đặt bán hàng</Link>
          </p>
        )}
      </div>
    );
  }

  const todo = sellerTodo(orders, newRequests);
  const tasks: Task[] = todo.complaints.map((o) => ({
    id: o.id,
    tag: 'Khiếu nại',
    title: `Đơn ${o.id} · người mua báo ${o.complaint?.reason.toLowerCase()}`,
    meta: `Còn ${o.complaint?.daysLeft} ngày để phản hồi`,
    to: routes.sellerOrder(o.id),
    action: 'Phản hồi',
    primary: true,
  }));
  const tiles = [
    { label: 'Đơn mới cần xác nhận', n: todo.newOrders, to: routes.sellerOrders, go: 'Đơn hàng' },
    { label: 'Yêu cầu báo giá mới', n: todo.newRequests, to: routes.sellerRequests, go: 'Yêu cầu báo giá' },
    { label: 'Maket bị yêu cầu sửa', n: todo.revise, to: todo.reviseOrder ? routes.sellerOrder(todo.reviseOrder) : routes.sellerOrders, go: todo.reviseOrder ? `Đơn ${todo.reviseOrder}` : 'Đơn hàng' },
    { label: 'Đơn chưa có hóa đơn', n: todo.noInvoice, to: routes.sellerOrders, go: 'Gắn hóa đơn' },
  ];
  return (
    <div className="page">
      <PageHeader
        title="Tổng quan"
        lead={
          <>
            {profile.shopName} <StatusBadge tone="ok">Đang mở bán</StatusBadge>
          </>
        }
      />
      <section aria-labelledby="todo-heading" className="stack">
        <h2 id="todo-heading" className="detail-heading">
          Việc cần làm
        </h2>
        <div className="stat-grid stat-grid--4">
          {tiles.map((t) => (
            <Link key={t.label} to={t.to} className="stat-tile">
              <span className="muted">{t.label}</span>
              <span className="stat-tile__num mk-num">{t.n}</span>
              <span className="stat-tile__go">{t.go}</span>
            </Link>
          ))}
        </div>
      </section>
      <section aria-labelledby="attention-heading" className="stack">
        <h2 id="attention-heading" className="detail-heading">
          Cần chú ý
        </h2>
        <TaskList
          empty="Không có việc gấp."
          tasks={[
            ...tasks,
            { id: 'money', tag: 'Tiền', title: 'Yêu cầu giải ngân đơn MK-C071 đã được duyệt', meta: '21/10/2026', to: routes.sellerDisbursements, action: 'Xem' },
          ]}
        />
      </section>
    </div>
  );
}
