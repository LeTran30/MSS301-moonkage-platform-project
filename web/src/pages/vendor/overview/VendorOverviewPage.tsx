import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Badge, Button, ButtonLink, Card, Icon, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useCurrentUser } from '@/entities/user';
import {
  canSendMaket,
  nextOrderStatus,
  orderCode,
  orderStatusLabel,
  useOrderList,
  type Order,
} from '@/entities/order';
import { useVendorRequestList } from '@/entities/request';
import { useMyVendorDetail, useMyVendorId } from '@/entities/vendor';
import { usePayVendorFee } from '@/features/pay-vendor-fee';
import styles from './VendorOverviewPage.module.css';

/** How many orders the "giao gấp" block lists; the order page lists them all. */
const URGENT_ORDER_LIMIT = 5;

/** The Shop has a step to take on the order: move it on, or send a maket. */
function needsShop(order: Order): boolean {
  return !order.hasDispute && (nextOrderStatus(order) !== null || canSendMaket(order));
}

export function VendorOverviewPage() {
  const user = useCurrentUser();
  const { run, busy, error } = useAction();

  /**
   * FR-27: hồ sơ của chủ Shop lấy từ `GET /api/vendors?ownerAccountId=me`
   * (mã vendor) rồi `GET /api/vendors/{vendorId}` (hồ sơ đầy đủ).
   */
  const asyncVendorId = useMyVendorId();
  const vendorId = asyncVendorId.kind === 'loaded' ? asyncVendorId.data : undefined;
  const asyncProfile = useMyVendorDetail(vendorId ?? null);

  // FR-32: đơn của chính Shop — `GET /api/orders?vendorId=...`.
  const asyncOrders = useOrderList({ vendorId });

  // FR-36: the requests sent to the Shop, with the Shop's own quotes.
  const asyncRequests = useVendorRequestList(vendorId ?? null);
  const requests = asyncRequests.kind === 'loaded' ? asyncRequests.data : [];

  const vendor = asyncProfile.kind === 'loaded' ? asyncProfile.data : null;
  const orders: Order[] = asyncOrders.kind === 'loaded' ? asyncOrders.data : [];

  const payVendorFee = usePayVendorFee(vendorId ?? '');

  // FR-27 Note: Trước khi mở bán: chỉ hiện trạng thái hồ sơ và nộp phí (B1.1)
  const isApproved = vendor?.status === 'APPROVED';
  const isFeePaid = Boolean(vendor?.registrationFeePaidAt);

  const handlePayOpeningFee = () => {
    void run(async () => {
      // AC-27.4: `POST /api/vendors/{vendorId}/registration-fee-payments` trả về
      // trang VNPay để mở; Shop chỉ mở bán sau khi thanh toán thành công.
      const vendorId = asyncVendorId.kind === 'loaded' ? asyncVendorId.data : null;
      if (!vendorId) {
        toast.info('Không tìm thấy hồ sơ gian hàng để nộp phí.');
        return;
      }
      const link = await payVendorFee();
      if (link?.paymentUrl) {
        window.open(link.paymentUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      toast.info('Không lấy được liên kết thanh toán. Vui lòng thử lại.');
    });
  };

  if (asyncProfile.kind === 'error') {
    return (
      <div className={styles.preLaunchContainer}>
        <Card padding="lg" tone="gold" className={styles.preLaunchCard}>
          <h2>Không tải được hồ sơ gian hàng</h2>
          <p>{asyncProfile.message}</p>
          <Button variant="primary" onClick={asyncProfile.reload}>
            Thử lại
          </Button>
        </Card>
      </div>
    );
  }

  if (!isApproved || !isFeePaid) {
    return (
      <div className={styles.preLaunchContainer}>
        <Card padding="lg" tone="gold" className={styles.preLaunchCard}>
          <div className={styles.preLaunchIcon}>
            <Icon name="store" size={40} />
          </div>
          <h2>Hồ sơ cửa hàng và phí mở bán</h2>
          <p>
            Trạng thái xét duyệt hồ sơ:{' '}
            {/* Trạng thái đọc từ máy chủ; khi chưa tải xong thì không hiện một
                trạng thái bịa. */}
            <Badge tone={isApproved ? 'green' : 'amber'}>
              {vendor?.status ?? 'Đang tải…'}
            </Badge>
          </p>

          {error && <p role="alert">{error}</p>}

          {!isFeePaid && isApproved && (
            <div className={styles.feeActionBox}>
              <p>
                Hồ sơ của bạn đã được <strong>Quản trị viên phê duyệt</strong>! Vui lòng nộp phí mở
                bán niêm yết để bắt đầu đăng sản phẩm và tiếp nhận đơn hàng.
              </p>
              <Button
                variant="primary"
                size="lg"
                iconRight="arrowRight"
                loading={busy}
                onClick={handlePayOpeningFee}
              >
                Nộp phí mở bán qua VNPay
              </Button>
            </div>
          )}

          {!isApproved && (
            <div className={styles.waitingNotice}>
              <Icon name="clock" size={20} />
              <span>
                Đội vận hành sàn Moonkage đang tiến hành đối chiếu CCCD và Giấy ĐKKD của đơn vị bạn.
              </span>
            </div>
          )}
        </Card>
      </div>
    );
  }

  const revenue = orders.reduce((acc, o) => acc + o.total, 0);

  // Khi đã mở bán: Khối "Việc cần làm" theo B1.0 Spec:
  // đơn mới, yêu cầu mới, maket bị yêu cầu sửa, đơn chưa có hóa đơn
  const pendingOrders = orders.filter(needsShop);
  // Yêu cầu còn mở mà Shop chưa có báo giá nào đang hiệu lực.
  const pendingRequests = requests.filter(
    (r) =>
      r.status === 'OPEN' &&
      !r.quotes.some((q) => q.status === 'SUBMITTED' || q.status === 'ACCEPTED'),
  );
  const urgentOrders = pendingOrders.slice(0, URGENT_ORDER_LIMIT);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {vendor?.businessName || user.vendorName || 'Gian hàng của tôi'}
          </h1>
          <p className={styles.lead}>
            Quản lý đơn hàng, trả lời báo giá số lượng lớn và cập nhật tiến độ sản xuất.
          </p>
        </div>

        <div className={styles.headerActions}>
          <ButtonLink to={routes.vendor.productNew} variant="primary" iconLeft="plus">
            Thêm sản phẩm mới
          </ButtonLink>
        </div>
      </div>

      {/* Khối "Việc cần làm" */}
      <Card padding="md" tone="gold" className={styles.actionCard}>
        <div className={styles.actionCardHeader}>
          <h3>Việc cần làm hôm nay</h3>
        </div>
        <div className={styles.actionList}>
          {pendingOrders.length > 0 && (
            <div className={styles.actionItem}>
              <div>
                <strong>{pendingOrders.length} đơn hàng mới cần xử lý:</strong> Xác nhận đơn và cập
                nhật mã vận đơn hoặc bản vẽ maket.
              </div>
              <ButtonLink to={routes.vendor.orders} variant="primary" size="sm">
                Xử lý đơn ngay
              </ButtonLink>
            </div>
          )}
          {pendingRequests.length > 0 && (
            <div className={styles.actionItem}>
              <div>
                <strong>{pendingRequests.length} yêu cầu báo giá doanh nghiệp mới:</strong> Cần soạn
                báo giá chiết khấu.
              </div>
              <ButtonLink to={routes.vendor.requests} variant="gold" size="sm">
                Soạn báo giá
              </ButtonLink>
            </div>
          )}
        </div>
      </Card>

      {/* Thống kê kinh doanh */}
      <div className={styles.statsGrid}>
        <Card padding="md" className={styles.statBox}>
          <Icon name="package" size={24} className={styles.statIcon} />
          <div>
            <div className={styles.statNum}>
              {asyncOrders.kind === 'loaded' ? orders.length : '—'}
            </div>
            <div className={styles.statText}>Đơn hàng phụ trách</div>
          </div>
        </Card>
        <Card padding="md" className={styles.statBox}>
          <Icon name="file" size={24} className={styles.statIcon} />
          <div>
            <div className={styles.statNum}>{requests.length}</div>
            <div className={styles.statText}>Yêu cầu báo giá nhận được</div>
          </div>
        </Card>
        <Card padding="md" className={styles.statBox}>
          <Icon name="wallet" size={24} className={styles.statIcon} />
          <div>
            <div className={styles.statNum}>
              {asyncOrders.kind === 'loaded' ? formatCurrency(revenue) : '—'}
            </div>
            <div className={styles.statText}>Tổng doanh số dự kiến</div>
          </div>
        </Card>
      </div>

      {/* Danh sách đơn hàng cần đóng gói & giao gấp */}
      <Card padding="md" className={styles.ordersCard}>
        <div className={styles.ordersCardHeader}>
          <h3>Đơn hàng cần đóng gói &amp; giao gấp</h3>
          <Link to={routes.vendor.orders} className={styles.viewLink}>
            Xem toàn bộ đơn ({orders.length}) →
          </Link>
        </div>

        <div className={styles.orderRows}>
          {asyncOrders.kind === 'error' ? (
            <div role="alert">
              <p className={styles.lead}>Không tải được đơn hàng: {asyncOrders.message}</p>
              <Button variant="secondary" size="sm" onClick={asyncOrders.reload}>
                Thử lại
              </Button>
            </div>
          ) : (
            asyncOrders.kind === 'loaded' &&
            urgentOrders.length === 0 && (
              <p className={styles.lead}>Không có đơn nào đang chờ Shop xử lý.</p>
            )
          )}
          {urgentOrders.map((o) => (
            <div key={o.id} className={styles.orderRow}>
              <div className={styles.orderLeft}>
                <strong>#{orderCode(o.id)}</strong>
                <Badge tone={o.type === 'BULK' ? 'gold' : 'neutral'} size="sm">
                  {o.type === 'BULK' ? 'Hợp đồng sỉ' : 'Mua lẻ'}
                </Badge>
                <span>{o.buyerName}</span>
              </div>
              <div className={styles.orderMid}>
                <span>
                  {o.items[0]?.name} (x{o.items[0]?.quantity})
                </span>
                <strong>{formatCurrency(o.total)}</strong>
              </div>
              <div className={styles.orderRight}>
                <Badge tone="amber" size="sm">
                  {orderStatusLabel(o.status)}
                </Badge>
                <ButtonLink to={routes.vendor.order(o.id)} variant="secondary" size="sm">
                  Chi tiết
                </ButtonLink>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
