import styles from './DepositPaymentPage.module.css';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency, formatDate } from '@/shared/utils';
import { Badge, Breadcrumbs, Button, ButtonLink, Card, Icon, Radio, toast } from '@/shared/ui';
import { openPaymentPage, useAction } from '@/shared/lib';
import { requestCode, useQuoteRequest } from '@/entities/request';
import { useAcceptQuote } from '@/features/accept-quote';

export function DepositPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const requestId = id || '';
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'VNPAY' | 'VIETQR'>('VNPAY');
  const { busy, run, error } = useAction();
  const acceptQuote = useAcceptQuote();

  // FR-19: the deposit of an accepted quote. The server computed the amount.
  const asyncRequest = useQuoteRequest(requestId);
  const req = asyncRequest.kind === 'loaded' ? asyncRequest.data : null;

  if (asyncRequest.kind === 'loading') {
    return <p role="status">Đang tải thông tin đặt cọc…</p>;
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
  if (!req) {
    return (
      <div>
        <p>Không tìm thấy yêu cầu báo giá.</p>
        <ButtonLink to={routes.account.requests}>Về danh sách yêu cầu</ButtonLink>
      </div>
    );
  }

  // The deposit comes from the accepted quote, not from a local guess.
  const acceptedQuote = req.quotes.find((q) => q.status === 'ACCEPTED');
  const depositAmount = acceptedQuote?.depositAmount ?? 0;

  function handleConfirmDeposit() {
    void run(async () => {
      if (!acceptedQuote) {
        toast.warning('Chưa có báo giá nào được chấp nhận cho yêu cầu này.');
        navigate(routes.account.request(req!.id));
        return;
      }
      if (paymentMethod === 'VNPAY') {
        // FR-19 / BR-04: the acceptance already created the payment; the buyer
        // pays the deposit at the gateway, the order exists after it succeeds.
        const acceptance = await acceptQuote(req!.id, acceptedQuote.id);
        openPaymentPage(acceptance.paymentUrl);
        return;
      }
      toast.success('Đã ghi nhận yêu cầu chuyển khoản VietQR. Xưởng sẽ liên hệ để xác nhận.');
      navigate(routes.account.requests);
    });
  }

  return (
    <div className={styles.container}>
      <Breadcrumbs
        items={[
          { label: 'Tài khoản', to: routes.account.overview },
          { label: 'Yêu cầu báo giá sỉ', to: routes.account.requests },
          {
            label: req.customRequirements || `Yêu cầu #${requestCode(req.id)}`,
            to: routes.account.request(req.id),
          },
          { label: 'Ký quỹ đặt cọc Escrow' },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Ký Quỹ Đặt Cọc Đơn Sỉ (#{requestCode(req.id)})</h1>
          <p className={styles.subtitle}>
            Bảo lãnh thanh toán qua Moonkage Escrow — Xưởng chỉ nhận tiền khi giao bánh đạt chuẩn
          </p>
        </div>
        <Badge tone="gold" size="md">
          <Icon name="check" size={14} /> Bảo vệ quyền lợi 100%
        </Badge>
      </div>

      <div className={styles.grid}>
        <Card padding="lg" className={styles.card}>
          <h2 className={styles.cardTitle}>Thông Tin Đơn Đặt Bánh Số Lượng Lớn</h2>
          <div className={styles.specList}>
            <div className={styles.specRow}>
              <span>Mục tiêu:</span>
              <span className={styles.strong}>
                {req.customRequirements || 'Khách không nêu yêu cầu riêng'}
              </span>
            </div>
            <div className={styles.specRow}>
              <span>Số lượng đặt:</span>
              <span className={styles.strong}>{req.quantity} hộp</span>
            </div>
            <div className={styles.specRow}>
              <span>Thời hạn cần giao:</span>
              <span className={styles.strong}>
                {req.deliveryDeadline ? formatDate(req.deliveryDeadline) : '—'}
              </span>
            </div>
            <div className={styles.specRow}>
              <span>Tổng giá trị hợp đồng:</span>
              <span className={styles.totalValue}>
                {formatCurrency(
                  acceptedQuote?.totalPrice ?? req.quantity * (req.budgetPerBox ?? 0),
                )}
              </span>
            </div>
          </div>

          <div className={styles.escrowBox}>
            <h3 className={styles.escrowTitle}>
              <Icon name="shield" size={18} /> Cam kết an toàn Escrow
            </h3>
            <ul className={styles.escrowList}>
              <li>Tiền cọc được phong tỏa trong tài khoản trung gian của Moonkage.</li>
              <li>
                Xưởng bánh nhận thông báo tiền cọc để tiến hành nhập nguyên liệu và in ấn maket.
              </li>
              <li>Nếu xưởng vi phạm tiến độ hoặc mẫu hộp sai lệch, bạn được hoàn cọc 100%.</li>
            </ul>
          </div>
        </Card>

        <Card padding="lg" className={styles.card}>
          <h2 className={styles.cardTitle}>Cấu Hình Phương Thức Ký Quỹ</h2>

          <div>
            <span className={styles.groupLabel} id="pm-label">
              Cổng thanh toán bảo mật:
            </span>
            <div className={styles.paymentOptions} role="radiogroup" aria-labelledby="pm-label">
              <label
                className={`${styles.paymentOption} ${paymentMethod === 'VNPAY' ? styles.paymentOptionActive : ''}`}
              >
                <Radio
                  name="pm"
                  value="VNPAY"
                  checked={paymentMethod === 'VNPAY'}
                  onChange={() => setPaymentMethod('VNPAY')}
                  inputClassName={styles.paymentRadioInput}
                  aria-label="Cổng thanh toán VNPay (ATM / Thẻ quốc tế / QR Pay)"
                />
                <div>
                  <div className={styles.strong}>
                    Cổng thanh toán VNPay (ATM / Thẻ quốc tế / QR Pay)
                  </div>
                  <div className={styles.optionHint}>
                    Xác nhận ký quỹ tức thì qua hệ thống ngân hàng
                  </div>
                </div>
              </label>

              <label
                className={`${styles.paymentOption} ${paymentMethod === 'VIETQR' ? styles.paymentOptionActive : ''}`}
              >
                <Radio
                  name="pm"
                  value="VIETQR"
                  checked={paymentMethod === 'VIETQR'}
                  onChange={() => setPaymentMethod('VIETQR')}
                  inputClassName={styles.paymentRadioInput}
                  aria-label="Chuyển khoản VietQR Doanh Nghiệp (Ủy nhiệm chi)"
                />
                <div>
                  <div className={styles.strong}>
                    Chuyển khoản VietQR Doanh Nghiệp (Ủy nhiệm chi)
                  </div>
                  <div className={styles.optionHint}>
                    Cung cấp hóa đơn VAT và hợp đồng mẫu 3 bên
                  </div>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.confirmRow}>
            <div className={styles.confirmTotal}>
              <span>Số tiền cần ký quỹ ngay:</span>
              <strong>{formatCurrency(depositAmount)}</strong>
            </div>
            <Button
              variant="primary"
              className={styles.confirmBtn}
              onClick={handleConfirmDeposit}
              loading={busy}
            >
              Xác Nhận Ký Quỹ Escrow An Toàn
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
