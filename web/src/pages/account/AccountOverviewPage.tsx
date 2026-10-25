import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { useNfcStatus } from '../../features/nfc';
import { activeOrderCount, orderTasks, useOrders } from '../../features/orders';
import { openRequestCount, requestTasks, useRequests } from '../../features/quotes';
import { routes } from '../../shared/config/routes';
import { LoadingState, PageHeader, TaskList } from '../../shared/ui';

/** M6.0: what needs the buyer now, then a few counters. */
export function AccountOverviewPage() {
  const { session } = useAuth();
  const orders = useOrders();
  const requests = useRequests();
  const { status } = useNfcStatus();
  if (orders.kind === 'loading' || requests.kind === 'loading') return <LoadingState />;
  const orderList = orders.kind === 'loaded' ? orders.data : [];
  const requestList = requests.kind === 'loaded' ? requests.data : [];
  const tasks = [...orderTasks(orderList), ...requestTasks(requestList)];
  const verified = status.kind === 'loaded' && status.info.nfcStatus === 'VERIFIED';

  return (
    <div className="stack-lg">
      <PageHeader title="Tài khoản của tôi" lead={`Xin chào, ${session?.displayName ?? ''}.`} />
      <section aria-labelledby="todo-heading" className="stack">
        <h2 id="todo-heading" className="detail-heading">
          Việc cần bạn <span className="mk-badge mk-badge--brand mk-num">{tasks.length}</span>
        </h2>
        <TaskList tasks={tasks} empty="Không có việc nào chờ bạn." />
      </section>
      <section aria-labelledby="recent-heading" className="stack">
        <h2 id="recent-heading" className="detail-heading">
          Gần đây
        </h2>
        <div className="stat-grid">
          <Link to={routes.orders} className="stat-tile">
            <span className="muted">Đơn đang chạy</span>
            <span className="stat-tile__num mk-num">{activeOrderCount(orderList)}</span>
            <span className="stat-tile__go">Đơn hàng</span>
          </Link>
          <Link to={routes.quoteRequests} className="stat-tile">
            <span className="muted">Yêu cầu đang mở</span>
            <span className="stat-tile__num mk-num">{openRequestCount(requestList)}</span>
            <span className="stat-tile__go">Yêu cầu và báo giá</span>
          </Link>
          <Link to={routes.verifyNfc} className="stat-tile">
            <span className="muted">Xác minh danh tính</span>
            <span className="stat-tile__num">{status.kind !== 'loaded' ? '…' : verified ? 'Đã xác minh' : 'Chưa'}</span>
            <span className="stat-tile__go">Xem trạng thái</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
