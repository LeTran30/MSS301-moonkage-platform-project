import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency, formatDate } from '@/shared/utils';
import { Badge, Button, ButtonLink, Card, Icon, toast } from '@/shared/ui';
import { openPaymentPage, useAction } from '@/shared/lib';
import {
  type Quote,
  type QuoteStatus,
  RequestSpecList,
  requestCode,
  useQuoteRequest,
  useRequestInvitations,
} from '@/entities/request';
import { useOrderList } from '@/entities/order';
import { useAcceptQuote } from '@/features/accept-quote';
import { InvoiceRequestForm } from '@/features/checkout';
import styles from './RequestComparePage.module.css';

/** Why a quote can no longer be accepted, in the buyer's words. */
const CLOSED_QUOTE_TEXT: Partial<Record<QuoteStatus, string>> = {
  WITHDRAWN: 'Đơn vị đã rút báo giá này',
  EXPIRED: 'Báo giá đã hết hiệu lực',
  CLOSED: 'Yêu cầu đã chốt với báo giá khác',
  REJECTED: 'Báo giá không được chọn',
};

export function RequestComparePage() {
  const { id } = useParams<{ id: string }>();
  const requestId = id || '';
  const navigate = useNavigate();
  const { busy, run, error } = useAction();
  const acceptQuote = useAcceptQuote();

  // FR-24: hóa đơn GTGT của đơn đặt riêng được hỏi lúc chấp nhận báo giá, đơn sinh ra sẽ mang theo.
  const [needInvoice, setNeedInvoice] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');

  // FR-17: the buyer compares the quotes of one request. The backend decides
  // from the token which quotes the caller may see.
  const asyncRequest = useQuoteRequest(requestId);
  const request = asyncRequest.kind === 'loaded' ? asyncRequest.data : null;
  // FR-15: a direct request goes to one Shop. Its invitation names the Shop and says whether it declined (AC-36.3).
  const isDirect = request?.type === 'DIRECT';
  const asyncInvitations = useRequestInvitations(isDirect ? (request?.id ?? null) : null);
  const targetInvitation =
    asyncInvitations.kind === 'loaded'
      ? asyncInvitations.data.find((i) => i.vendorId === request?.targetVendorId)
      : undefined;
  const targetName = targetInvitation?.vendorName;
  const declined = targetInvitation?.status === 'DECLINED';
  // The order an accepted quote became, once its deposit is paid (BR-04): the order keeps the quote's id.
  const asyncOrders = useOrderList();
  const orderOfQuote = (quoteId: string) =>
    asyncOrders.kind === 'loaded' ? asyncOrders.data.find((o) => o.quoteId === quoteId) : undefined;

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
    return <p>Không tìm thấy yêu cầu này.</p>;
  }

  // Chấp nhận báo giá & Chuyển sang đặt cọc (M6.2.2, FR-19, Flow 2)
  function handleAcceptQuoteAndDeposit(quote: Quote) {
    if (!request) return;
    if (
      needInvoice &&
      (!companyName.trim() || !taxCode.trim() || !companyAddress.trim() || !companyEmail.trim())
    ) {
      toast.error('Vui lòng điền đủ thông tin xuất hóa đơn GTGT.');
      return;
    }
    void run(async () => {
      // FR-19: `POST .../quotes/{quoteId}/acceptance` freezes the binding copy
      // and answers where to pay the deposit. The order exists only after the
      // deposit succeeds (BR-04), so no local order is created here.
      const acceptance = await acceptQuote(
        request.id,
        quote.id,
        needInvoice
          ? {
              invoiceInfo: {
                name: companyName.trim(),
                taxCode: taxCode.trim(),
                address: companyAddress.trim(),
                email: companyEmail.trim(),
              },
            }
          : undefined,
      );

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
          <Link to={routes.account.requests}>Yêu cầu &amp; báo giá</Link> /{' '}
          <span>#{requestCode(request.id)}</span>
        </div>
        <h2 className={styles.title}>
          {isDirect ? `Yêu cầu riêng gửi ${targetName ?? 'một đơn vị'}` : 'So Sánh Báo Giá Cạnh Nhau'}
        </h2>
        <p className={styles.lead}>
          Yêu cầu: <strong>{request.quantity} hộp</strong> · Ngày giao:{' '}
          <strong>{request.deliveryDeadline ? formatDate(request.deliveryDeadline) : '—'}</strong> ·
          Khu vực:{' '}
          <strong>{request.deliveryProvince}</strong>
        </p>
        {/* Thu gọn sẵn: so báo giá với yêu cầu mà thẻ báo giá không bị đẩy xuống. */}
        <details className={styles.specDetails}>
          <summary>Xem lại thông số bạn đã yêu cầu</summary>
          <RequestSpecList request={request} withDelivery />
        </details>
      </div>

      {request.quotes.length === 0 && declined ? (
        <Card padding="lg" className={styles.declinedCard}>
          <p>
            <strong>{targetName ?? 'Đơn vị'} đã từ chối yêu cầu này.</strong>
            {targetInvitation?.declineReason ? ` Lý do: ${targetInvitation.declineReason}` : ''}
          </p>
          <div className={styles.declinedActions}>
            <ButtonLink to={routes.base.vendors} variant="primary">
              Gửi cho đơn vị khác
            </ButtonLink>
            <ButtonLink to={routes.base.quoteRequestNew} variant="secondary">
              Tạo yêu cầu gửi nhiều xưởng
            </ButtonLink>
          </div>
        </Card>
      ) : request.quotes.length === 0 ? (
        <Card padding="lg">
          <p>
            {isDirect
              ? `Đang chờ ${targetName ?? 'đơn vị'} gửi báo giá.`
              : 'Chưa có xưởng nào gửi báo giá cho yêu cầu này.'}
          </p>
        </Card>
      ) : (
        <>
        {request.status === 'OPEN' && (
          <InvoiceRequestForm
            orderCount={1}
            description="Cần hóa đơn GTGT cho đơn đặt riêng? Điền một lần, xưởng được chọn sẽ xuất hóa đơn theo thông tin này."
            needInvoice={needInvoice}
            companyName={companyName}
            taxCode={taxCode}
            companyAddress={companyAddress}
            companyEmail={companyEmail}
            onNeedInvoiceChange={setNeedInvoice}
            onCompanyNameChange={setCompanyName}
            onTaxCodeChange={setTaxCode}
            onCompanyAddressChange={setCompanyAddress}
            onCompanyEmailChange={setCompanyEmail}
          />
        )}
        {/* Bảng báo giá cạnh nhau (Side-by-side comparison per IA Note M6.2.1) */}
        <div className={styles.comparisonGrid}>
          {request.quotes.map((quote) => {
            const acceptable = quote.acceptable !== false;
            return (
              <Card key={quote.id} padding="lg" tone="gold" className={styles.quoteCard}>
                <div className={styles.quoteCardHeader}>
                  <div>
                    <span className={styles.quoteId}>
                      Báo giá #{requestCode(quote.id)}
                      {quote.revisionNo && quote.revisionNo > 1 ? ` · Bản ${quote.revisionNo}` : ''}
                    </span>
                    <h3 className={styles.vendorName}>{quote.vendorName}</h3>
                  </div>
                  {quote.vendorRating > 0 && (
                    <div className={styles.ratingBadge}>
                      <Icon name="star" size={14} /> {quote.vendorRating.toFixed(1)}
                    </div>
                  )}
                </div>

                <div className={styles.priceHighlight}>
                  <span className={styles.unitPrice}>{formatCurrency(quote.unitPrice)}</span>
                  <span className={styles.perUnit}>/ hộp quà hoàn thiện</span>
                </div>

                <div className={styles.specTable}>
                  <div className={styles.specRow}>
                    <span>Tiền hàng ({request.quantity} hộp):</span>
                    <span>{formatCurrency(quote.unitPrice * request.quantity)}</span>
                  </div>
                  <div className={styles.specRow}>
                    <span>Phí giao hàng:</span>
                    <span>{quote.shippingFee > 0 ? formatCurrency(quote.shippingFee) : 'Miễn phí'}</span>
                  </div>
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
                    <span>Phần còn lại (trả sau khi giao):</span>
                    <span>{formatCurrency(quote.remainingAmount)}</span>
                  </div>
                  <div className={styles.specRow}>
                    <span>Ngày cam kết giao:</span>
                    <strong>
                      {quote.estimatedDeliveryDate ? formatDate(quote.estimatedDeliveryDate) : '—'}
                    </strong>
                  </div>
                  <div className={styles.specRow}>
                    <span>Cách thức vận chuyển:</span>
                    <span>{quote.deliveryMethod}</span>
                  </div>
                  <div className={styles.specRow}>
                    <span>Hiệu lực báo giá đến:</span>
                    <span>{quote.validUntil ? formatDate(quote.validUntil) : '—'}</span>
                  </div>
                </div>

                {quote.note && (
                  <div className={styles.quoteNote}>
                    <Icon name="sparkle" size={14} /> <strong>Ghi chú xưởng:</strong> {quote.note}
                  </div>
                )}

                <div className={styles.quoteActions}>
                  {quote.status === 'ACCEPTED' ? (
                    <AcceptedQuoteActions
                      orderId={orderOfQuote(quote.id)?.id}
                      depositTo={routes.account.requestDeposit(request.id)}
                    />
                  ) : acceptable ? (
                    <Button
                      variant="primary"
                      size="lg"
                      block
                      iconLeft="check"
                      loading={busy}
                      onClick={() => handleAcceptQuoteAndDeposit(quote)}
                    >
                      Chấp nhận &amp; Đặt cọc {formatCurrency(quote.depositAmount)}
                    </Button>
                  ) : (
                    <Badge tone="neutral" size="sm">
                      {CLOSED_QUOTE_TEXT[quote.status] ?? 'Báo giá không còn nhận chấp nhận'}
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
        </>
      )}
    </div>
  );
}

/** The buyer took this quote: open the order it became, or finish the deposit that creates it (BR-04). */
function AcceptedQuoteActions({ orderId, depositTo }: { orderId?: string; depositTo: string }) {
  return (
    <>
      <Badge tone="green" size="sm">
        <Icon name="check" size={13} /> Bạn đã chấp nhận báo giá này
      </Badge>
      {orderId ? (
        <ButtonLink to={routes.account.order(orderId)} variant="primary" block iconRight="arrowRight">
          Xem đơn hàng
        </ButtonLink>
      ) : (
        <ButtonLink to={depositTo} variant="primary" block iconRight="arrowRight">
          Hoàn tất đặt cọc
        </ButtonLink>
      )}
    </>
  );
}
