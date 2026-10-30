import { Link } from 'react-router-dom';
import { useDisputes } from '@/entities/dispute';
import { useDisbursementRequests, usePayouts } from '@/entities/payout';
import { useApplications } from '@/entities/vendor';
import { routes } from '@/shared/config/routes';
import { LoadingState, PageHeader, TaskList } from '@/shared/ui';
import { formatVnd } from '@/shared/utils/money';
import styles from './AdminOverview.module.css';

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
    { label: 'Hồ sơ người bán chờ duyệt', n: pending.length, to: routes.admin.vendors, go: 'Người bán' },
    { label: 'Giải ngân cọc chờ duyệt', n: waitingDis.length, to: routes.admin.disbursements, go: 'Duyệt giải ngân' },
    { label: 'Đơn chờ chuyển tiền', n: toPay.length, to: routes.admin.payouts, go: 'Chuyển tiền' },
    { label: 'Khiếu nại đang mở', n: open.length, to: routes.admin.disputes, go: 'Khiếu nại' },
  ];
  return (
    <div className="page">
      <PageHeader title="Tổng quan" lead="Hàng chờ xử lý, cũ nhất trước." />
      <div className={styles.statGrid}>
        {tiles.map((t) => (
          <Link key={t.label} to={t.to} className={styles.statTile}>
            <span className="muted">{t.label}</span>
            <span className={`${styles.statNum} mk-num`}>{t.n}</span>
            <span className={styles.statGo}>{t.go}</span>
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
            ...open.map((d) => ({ id: d.id, tag: 'Khiếu nại', title: `${d.id} · đơn ${d.orderId}${d.vendorProposal ? ' · người bán đã đề xuất' : ''}`, meta: `mở ${d.openedAt}`, to: routes.admin.dispute(d.id), action: 'Xử lý', primary: true })),
            ...pending.map((a) => ({ id: a.id, tag: 'Hồ sơ', title: `${a.shopName} · ${a.kind.toLowerCase()}`, meta: a.waiting, to: routes.admin.vendor(a.id), action: 'Xử lý' })),
            ...waitingDis.map((d) => ({ id: d.id, tag: 'Giải ngân', title: `${d.orderId} · ${formatVnd(d.amount)}`, meta: `xin ${d.askedAt}`, to: routes.admin.disbursements, action: 'Xử lý' })),
          ]}
        />
      </section>
      <section className="panel panel--wide" aria-labelledby="flag">
        <h2 id="flag" className="detail-heading">
          Đơn bị đánh dấu đối soát <span className="mk-badge mk-badge--brand">1</span>
        </h2>
        <div className="row-between">
          <span>MK-8702 · tiền VNPay báo về khác số tiền đơn 25.000đ</span>
          <Link to={routes.admin.reconciliation} className="mk-btn mk-btn--quiet mk-btn--sm">
            Xem đối soát
          </Link>
        </div>
      </section>
    </div>
  );
}

