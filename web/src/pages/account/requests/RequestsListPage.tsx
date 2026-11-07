import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatDate } from '@/shared/utils';
import { Badge, Button, ButtonLink, Card, Icon } from '@/shared/ui';
import { REQUEST_STATUS_LABELS, requestCode, useQuoteRequestList } from '@/entities/request';
import styles from './RequestsListPage.module.css';

export function RequestsListPage() {
  // FR-16 / FR-15: the requests of the caller; the backend decides the role.
  const asyncRequests = useQuoteRequestList();
  const requests = asyncRequests.kind === 'loaded' ? asyncRequests.data : [];

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
          <div className={styles.eyebrow}>YÊU CẦU &amp; BÁO GIÁ</div>
          <h2 className={styles.title}>Quản Lý Yêu Cầu Báo Giá Của Bạn</h2>
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
                    <strong className={styles.highlightCount}>{quoteTotal} xưởng đã báo giá</strong>
                  </div>
                </div>

                {req.customRequirements && (
                  <p className={styles.reqText}>
                    <strong>Yêu cầu riêng:</strong> {req.customRequirements}
                  </p>
                )}

                <div className={styles.cardFooter}>
                  <div className={styles.vendorStats}>
                    <Icon name="users" size={14} /> {req.invitedVendorsCount} xưởng được mời tham
                    gia
                  </div>
                  <ButtonLink
                    to={routes.account.request(req.id)}
                    variant="primary"
                    size="sm"
                    iconRight="chevronRight"
                  >
                    So sánh {quoteTotal} bảng báo giá
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
