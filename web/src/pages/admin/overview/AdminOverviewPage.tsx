import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, Badge, Button, AsyncState } from '@/shared/ui';
import { formatCurrency } from '@/shared/utils';
import { routes } from '@/shared/config';
import { useAdminOverview } from '@/features/admin-overview';
import styles from './AdminOverviewPage.module.css';

/**
 * Q1.0 — the admin's desk.
 *
 * Every number comes from the backend: the escrow from
 * `GET /api/ledgers` (admin: every ledger), the open disputes from
 * `GET /api/orders?disputeStatus=OPEN` (FR-49), the pending profiles from
 * `GET /api/vendors?status=PENDING` (FR-45).
 */
export function AdminOverviewPage() {
  const navigate = useNavigate();

  const asyncOverview = useAdminOverview();

  return (
    <div className={styles.page}>
      <AsyncState state={asyncOverview} onRetry={asyncOverview.reload}>
        {(data) => (
          <>
            <div className={styles.header}>
              <div>
                <h1 className={styles.title}>Bàn làm việc Quản trị viên</h1>
                <p className={styles.desc}>
                  Giám sát vận hành toàn sàn Moonkage: duyệt người bán, phân xử khiếu nại, giữ tiền
                  ký quỹ và cấu hình tham số sàn.
                </p>
              </div>
              <div className={styles.systemStatus}>
                <span className={styles.pulseDot} />
                <span>
                  Ký quỹ và cổng VNPay: <strong>Hoạt động bình thường</strong>
                </span>
              </div>
            </div>

            {/* 4 Action Queues (Hàng chờ xử lý) */}
            <div className={styles.queueGrid}>
              <Card className={`${styles.queueCard} ${styles.borderRed}`}>
                <div className={styles.queueHeader}>
                  <span className={styles.queueTitle}>Khiếu nại cần phân xử</span>
                  <Badge tone="red">{data.openDisputes.length} vụ việc</Badge>
                </div>
                <p className={styles.queueDesc}>
                  Đang khóa số dư ký quỹ <strong>{formatCurrency(data.frozenDisputes)}</strong> cho
                  các đơn có khiếu nại mở.
                </p>
                <div className={styles.queueAction}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(routes.admin.disputes)}
                  >
                    Xử lý tranh chấp ngay
                  </Button>
                </div>
              </Card>

              <Card className={`${styles.queueCard} ${styles.borderGold}`}>
                <div className={styles.queueHeader}>
                  <span className={styles.queueTitle}>Hồ sơ người bán chờ duyệt</span>
                  <Badge tone="gold">{data.pendingVendors.length} hồ sơ mới</Badge>
                </div>
                <p className={styles.queueDesc}>
                  Cần đối chiếu CCCD gắn chip NFC và Giấy chứng nhận ĐKKD Hộ kinh doanh/DNTN.
                </p>
                <div className={styles.queueAction}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(routes.admin.vendors)}
                  >
                    Thẩm định hồ sơ
                  </Button>
                </div>
              </Card>

              <Card className={styles.queueCard}>
                <div className={styles.queueHeader}>
                  <span className={styles.queueTitle}>Sản phẩm mới chờ kiểm duyệt</span>
                  <Badge tone="neutral">Duyệt danh mục</Badge>
                </div>
                <p className={styles.queueDesc}>
                  Kiểm tra thông tin nguyên liệu, phân loại vỏ và nhân theo quy chuẩn.
                </p>
                <div className={styles.queueAction}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(routes.admin.products)}
                  >
                    Duyệt danh mục
                  </Button>
                </div>
              </Card>

              <Card className={styles.queueCard}>
                <div className={styles.queueHeader}>
                  <span className={styles.queueTitle}>Yêu cầu giải ngân cọc sản xuất</span>
                  <Badge tone="neutral">Duyệt giải ngân</Badge>
                </div>
                <p className={styles.queueDesc}>
                  {data.escrowTotal > 0
                    ? `Đang giữ ${formatCurrency(data.escrowTotal)} trong ký quỹ chờ giải ngân.`
                    : 'Chưa có khoản tiền nào chờ giải ngân.'}
                </p>
                <div className={styles.queueAction}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(routes.admin.money)}
                  >
                    Duyệt giải ngân
                  </Button>
                </div>
              </Card>
            </div>

            {/* Financial Escrow Snapshot */}
            <Card className={styles.financeCard}>
              <CardHeader
                title="Dòng tiền ký quỹ toàn sàn"
                description="Tất cả các dòng tiền thanh toán được tạm giữ bởi Moonkage để đảm bảo an toàn giao dịch"
              />

              <div className={styles.financeMetrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Tổng tiền đang giữ</span>
                  <strong className={styles.metricVal}>{formatCurrency(data.escrowTotal)}</strong>
                  <span className={styles.metricSub}>Bao gồm cọc sản xuất &amp; đơn bán lẻ</span>
                </div>

                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Tiền đang bị đóng băng khiếu nại</span>
                  <strong className={`${styles.metricVal} ${styles.redText}`}>
                    {formatCurrency(data.frozenDisputes)}
                  </strong>
                  <span className={styles.metricSub}>Không thể rút cho đến khi có phán quyết</span>
                </div>

                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Đã hoàn trả người mua</span>
                  <strong className={`${styles.metricVal} ${styles.greenText}`}>
                    {formatCurrency(data.refunded)}
                  </strong>
                  <span className={styles.metricSub}>Sàn không thu hoa hồng</span>
                </div>

                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Đơn hàng chờ phân xử</span>
                  <strong className={styles.metricVal}>{data.openDisputes.length}</strong>
                  <span className={styles.metricSub}>Có khiếu nại đang mở</span>
                </div>
              </div>
            </Card>

            {/* Quick Navigation into Config */}
            <div className={styles.configBanner}>
              <div>
                <h4>Cấu hình quy tắc &amp; danh mục sàn</h4>
                <p>
                  Điều chỉnh biểu phí ship liên tỉnh, phí mở bán và danh mục vỏ và nhân bánh.
                </p>
              </div>
              <Button variant="ghost" onClick={() => navigate(routes.admin.config)}>
                Mở trang cấu hình
              </Button>
            </div>
          </>
        )}
      </AsyncState>
    </div>
  );
}
