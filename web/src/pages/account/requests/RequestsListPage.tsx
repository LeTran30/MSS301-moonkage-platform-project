import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatDate } from '@/shared/utils';
import { Badge, Button, ButtonLink, Card, Icon } from '@/shared/ui';
import {
  REQUEST_STATUS_LABELS,
  requestCode,
  useQuoteRequestList,
  type QuoteRequest,
} from '@/entities/request';
import { useVendors } from '@/entities/vendor';
import styles from './RequestsListPage.module.css';

/** What the request's button leads to: nothing to compare yet, one quote, or several (FR-17). */
function openLabel(quoteTotal: number): string {
  if (quoteTotal === 0) return 'Xem yêu cầu';
  if (quoteTotal === 1) return 'Xem báo giá';
  return `So sánh ${quoteTotal} báo giá`;
}

/** How many quotes came in; a direct request has one Shop to wait for (FR-15). */
function quoteCountText(request: QuoteRequest, quoteTotal: number): string {
  if (request.type === 'DIRECT') return quoteTotal > 0 ? 'Đơn vị đã báo giá' : 'Chờ đơn vị báo giá';
  return quoteTotal > 0 ? `${quoteTotal} xưởng đã báo giá` : 'Chưa có báo giá';
}

export function RequestsListPage() {
  // FR-16 / FR-15: the requests of the caller; the backend decides the role.
  const asyncRequests = useQuoteRequestList();
  const requests = asyncRequests.kind === 'loaded' ? asyncRequests.data : [];
  // Tên đơn vị nhận yêu cầu riêng, lấy từ danh mục đơn vị đã tải (yêu cầu chỉ mang mã đơn vị).
  const vendors = useVendors();
  const vendorName = (vendorId?: string) => vendors.find((v) => v.id === vendorId)?.name;

  if (asyncRequests.kind === 'loading') {
    return <p role="status">Đang tải yêu cầu báo giá…</p>;
  }
  if (asyncRequests.kind === 'error') {
    return (
      <div role="alert">
        <p>{asyncRequests.message}</p>
        <Button variant="secondary" onClick={asyncRequests.reload}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Yêu cầu báo giá của bạn</h2>
          <p className={styles.lead}>
            Theo dõi danh sách yêu cầu đặt số lượng lớn và so sánh bảng giá từ các xưởng.
          </p>
        </div>
        <ButtonLink to={routes.base.quoteRequestNew} variant="gold" iconLeft="plus">
          Tạo yêu cầu mới
        </ButtonLink>
      </div>

      {requests.length === 0 ? (
        <Card padding="lg">
          <p>Bạn chưa có yêu cầu báo giá nào.</p>
          <ButtonLink to={routes.base.quoteRequestNew} variant="primary" iconRight="arrowRight">
            Tạo yêu cầu đầu tiên
          </ButtonLink>
        </Card>
      ) : (
        <div className={styles.list}>
          {requests.map((req) => {
            const quoteTotal = req.quotes.length || req.quoteCount || 0;
            return (
              <Card key={req.id} padding="md" className={styles.requestCard}>
                <div className={styles.reqHeader}>
                  <div className={styles.idWrap}>
                    <Icon name="file" size={18} />
                    <strong>#{requestCode(req.id)}</strong>
                    <Badge tone={req.type === 'OPEN' ? 'gold' : 'neutral'} size="sm">
                      {req.type === 'OPEN' ? 'Gửi nhiều nơi' : 'Gửi riêng'}
                    </Badge>
                    <span className={styles.date}>Tạo ngày {formatDate(req.createdAt)}</span>
                  </div>
                  <Badge tone={req.status === 'OPEN' ? 'green' : 'neutral'}>
                    {REQUEST_STATUS_LABELS[req.status]}
                  </Badge>
                </div>

                <div className={styles.detailsGrid}>
                  <div>
                    <span className={styles.label}>Số lượng:</span>
                    <strong>{req.quantity} hộp</strong>
                  </div>
                  <div>
                    <span className={styles.label}>Hạn giao:</span>
                    <span>{req.deliveryDeadline ? formatDate(req.deliveryDeadline) : '—'}</span>
                  </div>
                  <div>
                    <span className={styles.label}>Khu vực:</span>
                    <span>{req.deliveryProvince}</span>
                  </div>
                  <div>
                    <span className={styles.label}>Báo giá nhận được:</span>
                    <strong className={quoteTotal > 0 ? styles.highlightCount : undefined}>
                      {quoteCountText(req, quoteTotal)}
                    </strong>
                  </div>
                </div>

                {req.customRequirements && (
                  <p className={styles.reqText}>
                    <strong>Ghi chú:</strong> {req.customRequirements}
                  </p>
                )}

                <div className={styles.cardFooter}>
                  <div className={styles.vendorStats}>
                    {req.type === 'DIRECT' ? (
                      <>
                        <Icon name="store" size={14} /> Gửi riêng cho{' '}
                        {vendorName(req.targetVendorId) ?? 'một đơn vị'}
                      </>
                    ) : (
                      <>
                        <Icon name="users" size={14} /> {req.invitedVendorsCount} xưởng được mời tham
                        gia
                      </>
                    )}
                  </div>
                  <ButtonLink
                    to={routes.account.request(req.id)}
                    variant="primary"
                    size="sm"
                    iconRight="chevronRight"
                  >
                    {openLabel(quoteTotal)}
                  </ButtonLink>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <p className={styles.lead}>
        <Link to={routes.base.bulk}>Về hub đặt số lượng lớn</Link>
      </p>
    </div>
  );
}
