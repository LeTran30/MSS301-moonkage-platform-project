import { useParams, Link, useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Badge, Button, Card, Icon } from '@/shared/ui';
import { openPaymentPage, useAction } from '@/shared/lib';
import { type Quote, useQuoteRequest } from '@/entities/request';
import { useCurrentUser } from '@/entities/user';
import { useAcceptQuote } from '@/features/accept-quote';
import styles from './RequestComparePage.module.css';

export function RequestComparePage() {
  const { id } = useParams<{ id: string }>();
  const requestId = id || '';
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { busy, run, error } = useAction();
  const acceptQuote = useAcceptQuote();

  // FR-17: the buyer compares the quotes of one request. The backend decides
  // from the token which quotes the caller may see.
  const asyncRequest = useQuoteRequest(requestId);
  const request = asyncRequest.kind === 'loaded' ? asyncRequest.data : null;

  if (asyncRequest.kind === 'loading') {
    return <p role="status">Đang tải bảng báo giá…</p>;
  }
  if (asyncRequest.kind === 'error') {
    return (
      <div role="alert">
        <p>{asyncRequest.message}</p>
        <Button variant="secondary" onClick={asyncRequest.reload}>
          Thử lại
        </Button>
      </div>
    );
  }
  if (!request) {
    return <p>Không tìm thấy yêu cầu #{id}</p>;
  }

  // Chấp nhận báo giá & Chuyển sang đặt cọc (M6.2.2, FR-19, Flow 2)
  function handleAcceptQuoteAndDeposit(quote: Quote) {
    if (!request) return;
    void run(async () => {
      // FR-19: `POST .../quotes/{quoteId}/acceptance` freezes the binding copy
      // and answers where to pay the deposit. The order exists only after the
      // deposit succeeds (BR-04), so no local order is created here.
      const acceptance = await acceptQuote(request.id, quote.id);

      if (acceptance.paymentUrl) {
        openPaymentPage(acceptance.paymentUrl);
        return;
      }
      navigate(routes.account.requestDeposit(request.id));
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link to={routes.account.requests}>Yêu cầu &amp; báo giá</Link> / <span>#{request.id}</span>
        </div>
        <h2 className={styles.title}>So Sánh Báo Giá Cạnh Nhau (M6.2.1, FR-17)</h2>
        <p className={styles.lead}>
          Yêu cầu: <strong>{request.quantity} hộp</strong> · Ngày giao: <strong>{request.deliveryDeadline}</strong> · Khu vực: <strong>{request.deliveryProvince}</strong>
        </p>
      </div>

      {request.quotes.length === 0 ? (
        <Card padding="lg">
          <p>Chưa có xưởng nào gửi báo giá cho yêu cầu này.</p>
        </Card>
      ) : (
        /* Bảng báo giá cạnh nhau (Side-by-side comparison per IA Note M6.2.1) */
        <div className={styles.comparisonGrid}>
          {request.quotes.map((quote) => {
            const acceptable = quote.acceptable !== false;
            return (
              <Card key={quote.id} padding="lg" tone="gold" className={styles.quoteCard}>
                <div className={styles.quoteCardHeader}>
                  <div>
                    <span className={styles.quoteId}>
                      Báo giá #{quote.id}
                      {quote.revisionNo && quote.revisionNo > 1 ? ` · Bản ${quote.revisionNo}` : ''}
                    </span>
                    <h3 className={styles.vendorName}>{quote.vendorName}</h3>
                  </div>
                  <div className={styles.ratingBadge}>
                    <Icon name="star" size={14} /> {quote.vendorRating}
                  </div>
                </div>

                <div className={styles.priceHighlight}>
                  <span className={styles.unitPrice}>{formatCurrency(quote.unitPrice)}</span>
                  <span className={styles.perUnit}>/ hộp quà hoàn thiện</span>
                </div>

                <div className={styles.specTable}>
                  <div className={styles.specRow}>
                    <span>Tổng tiền hợp đồng:</span>
                    <strong>{formatCurrency(quote.totalPrice)}</strong>
                  </div>
                  <div className={styles.specRow}>
                    <span>Tỷ lệ đặt cọc:</span>
                    <span className={styles.depositPill}>
                      {quote.depositPercent}% cọc ({formatCurrency(quote.depositAmount)})
                    </span>
                  </div>
                  <div className={styles.specRow}>
                    <span>Phần còn lại (trả khi nhận):</span>
                    <span>{formatCurrency(quote.remainingAmount)}</span>
                  </div>
                  <div className={styles.specRow}>
                    <span>Ngày cam kết giao:</span>
                    <strong>{quote.estimatedDeliveryDate}</strong>
                  </div>
                  <div className={styles.specRow}>
                    <span>Cách thức vận chuyển:</span>
                    <span>{quote.deliveryMethod}</span>
                  </div>
                  <div className={styles.specRow}>
                    <span>Hiệu lực báo giá đến:</span>
                    <span>{quote.validUntil}</span>
                  </div>
                </div>

                {quote.note && (
                  <div className={styles.quoteNote}>
                    <Icon name="sparkle" size={14} /> <strong>Ghi chú xưởng:</strong> {quote.note}
                  </div>
                )}

                <div className={styles.quoteActions}>
                  {acceptable ? (
                    <Button
                      variant="primary"
                      size="lg"
                      block
                      iconLeft="check"
                      loading={busy}
                      onClick={() => handleAcceptQuoteAndDeposit(quote)}
                    >
                      Chấp nhận &amp; Đặt cọc {formatCurrency(quote.depositAmount)} (M6.2.2)
                    </Button>
                  ) : (
                    <Badge tone="neutral" size="sm">
                      Báo giá không còn hiệu lực
                    </Badge>
                  )}
                  {error && (
                    <p className={styles.errorText} role="alert">
                      {error}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <p className={styles.lead}>
        Người mua: <strong>{request.buyerName || user.name}</strong>
      </p>
    </div>
  );
}

