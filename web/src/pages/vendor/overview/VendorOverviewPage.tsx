import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Badge, Button, ButtonLink, Card, Icon, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useCurrentUser } from '@/entities/user';
import { useOrderList, type Order } from '@/entities/order';
import { useRequests } from '@/entities/request';
import { useMyVendorDetail, useMyVendorId } from '@/entities/vendor';
import { usePayVendorFee } from '@/features/pay-vendor-fee';
import styles from './VendorOverviewPage.module.css';

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

  const requests = useRequests().filter((r) => r.targetVendorId === user.vendorId);

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
          <h2>Hồ Sơ Cửa Hàng &amp; Phí Mở Bán (B1.0, B1.1)</h2>
          <p>
            Trạng thái xét duyệt hồ sơ:{' '}
            <Badge tone={isApproved ? 'green' : 'amber'}>{vendor?.status || 'PENDING'}</Badge>
          </p>

          {error && <p role="alert">{error}</p>}

          {!isFeePaid && isApproved && (
            <div className={styles.feeActionBox}>
              <p>
                Hồ sơ của bạn đã được <strong>Quản trị viên phê duyệt</strong>! Vui lòng nộp phí mở bán
                niêm yết để bắt đầu đăng sản phẩm và tiếp nhận đơn hàng.
              </p>
              <Button
                variant="primary"
                size="lg"
                iconRight="arrowRight"
                loading={busy}
                onClick={handlePayOpeningFee}
              >
                Nộp phí mở bán qua VNPay (B1.1, FR-53)
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
  const pendingOrders = orders.filter((o) => o.status === 'PAID' || o.status === 'WAITING_MAKET');
  const pendingRequests = requests.filter((r) => r.status === 'OPEN');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>KÊNH BÁN HÀNG · TỔNG QUAN (B1.0, FLOW 4)</div>
          <h1 className={styles.title}>
            {vendor?.businessName || user.vendorName || 'Gian hàng của tôi'}
          </h1>
          <p className={styles.lead}>
            Quản lý đơn hàng, trả lời báo giá số lượng lớn và cập nhật tiến độ sản xuất.
          </p>
        </div>

        <div className={styles.headerActions}>
          <ButtonLink to={routes.vendor.productNew} variant="primary" iconLeft="plus">
            Thêm sản phẩm mới (B4.1)
          </ButtonLink>
        </div>
      </div>

      {/* Khối "Việc cần làm" (B1.0 Spec) */}
      <Card padding="md" tone="gold" className={styles.actionCard}>
        <div className={styles.actionCardHeader}>
          <Icon name="sparkle" size={18} />
          <h3>Khối &quot;Việc cần làm hôm nay&quot;</h3>
        </div>
        <div className={styles.actionList}>
          {pendingOrders.length > 0 && (
            <div className={styles.actionItem}>
              <div>
                <strong>{pendingOrders.length} đơn hàng mới cần xử lý:</strong> Xác nhận đơn và cập nhật mã
                vận đơn hoặc bản vẽ maket.
              </div>
              <ButtonLink to={routes.vendor.orders} variant="primary" size="sm">
                Xử lý đơn ngay (B2.0)
              </ButtonLink>
            </div>
          )}
          {pendingRequests.length > 0 && (
            <div className={styles.actionItem}>
              <div>
                <strong>{pendingRequests.length} yêu cầu báo giá doanh nghiệp mới:</strong> Cần soạn báo
                giá chiết khấu.
              </div>
              <ButtonLink to={routes.vendor.requests} variant="gold" size="sm">
                Soạn báo giá (B3.2)
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
            <div className={styles.statNum}>{orders.length}</div>
            <div className={styles.statText}>Đơn hàng phụ trách</div>
          </div>
        </Card>
        <Card padding="md" className={styles.statBox}>
          <Icon name="file" size={24} className={styles.statIcon} />
          <div>
            <div className={styles.statNum}>{requests.length}</div>
            <div className={styles.statText}>Yêu cầu sỉ &amp; in logo</div>
          </div>
        </Card>
        <Card padding="md" className={styles.statBox}>
          <Icon name="wallet" size={24} className={styles.statIcon} />
          <div>
            <div className={styles.statNum}>{formatCurrency(revenue)}</div>
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
          {orders.map((o) => (
            <div key={o.id} className={styles.orderRow}>
              <div className={styles.orderLeft}>
                <strong>#{o.id}</strong>
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
                <Badge tone={o.status === 'DELIVERED' ? 'green' : 'amber'} size="sm">
                  {o.status}
                </Badge>
                <ButtonLink to={routes.vendor.order(o.id)} variant="secondary" size="sm">
                  Chi tiết (B2.1/B2.2)
                </ButtonLink>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
