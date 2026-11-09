import styles from './VendorFeePage.module.css';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Button, ButtonLink, Card, Badge, Breadcrumbs, toast } from '@/shared/ui';
import { openPaymentPage, useAction } from '@/shared/lib';
import { useCurrentUser } from '@/entities/user';
import {
  useMyVendorDetail,
  useOwnVendorId,
  useRegistrationFeeConfig,
  VENDOR_STATUS_LABELS,
} from '@/entities/vendor';
import { usePayVendorFee } from '@/features/pay-vendor-fee';

/**
 * B1.1 — đóng phí mở bán (FR-53, AC-27.4).
 *
 * Phí đóng một lần qua VNPay sau khi hồ sơ được duyệt; Shop chỉ mở bán khi
 * khoản phí đã về. Trang chỉ nói những gì hệ thống thật sự làm.
 */
export function VendorFeePage() {
  const user = useCurrentUser();
  const vendorId = useOwnVendorId(user.vendorId);
  const asyncProfile = useMyVendorDetail(vendorId || null);
  const vendor = asyncProfile.kind === 'loaded' ? asyncProfile.data : null;
  const { busy, run, error } = useAction();
  const payVendorFee = usePayVendorFee(vendorId);

  // FR-53 / AC-26.9: the registration fee level in effect, shown before paying.
  // Mức phí đọc từ máy chủ; chưa tải xong thì không hiện một con số bịa.
  const asyncFee = useRegistrationFeeConfig();
  const feeAmount = asyncFee.kind === 'loaded' ? (asyncFee.data?.amount ?? null) : null;

  const isApproved = vendor?.status === 'APPROVED';
  const isFeePaid = Boolean(vendor?.registrationFeePaidAt);

  function handlePayFee() {
    if (feeAmount === null) {
      toast.error('Chưa tải được mức phí mở bán hiện hành. Vui lòng thử lại.');
      return;
    }
    void run(async () => {
      // AC-27.4: `POST /api/vendors/{vendorId}/registration-fee-payments` answers
      // the VNPay page; cùng tab để trang kết quả còn giữ phiên đăng nhập.
      const link = await payVendorFee();
      if (!link?.paymentUrl) {
        throw new Error('Không lấy được liên kết thanh toán. Vui lòng thử lại.');
      }
      openPaymentPage(link.paymentUrl);
    });
  }

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Kênh người bán', to: routes.vendor.overview },
          { label: 'Phí mở bán' },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Phí mở bán</h1>
          <p className={styles.subtitle}>
            Đóng một lần qua VNPay sau khi hồ sơ được duyệt. Gian hàng mở bán ngay khi khoản phí
            được xác nhận.
          </p>
        </div>
        {vendor?.status && (
          <Badge tone={isApproved ? 'green' : 'amber'} size="md">
            {VENDOR_STATUS_LABELS[vendor.status]}
          </Badge>
        )}
      </div>

      <Card padding="lg" className={styles.planCard}>
        <div className={styles.planPrice}>
          {feeAmount === null ? (
            <span className={styles.planPeriod}>Đang tải mức phí hiện hành…</span>
          ) : (
            formatCurrency(feeAmount)
          )}
        </div>
        <ul className={styles.planFeatures}>
          <li>Đóng một lần, không gia hạn.</li>
          <li>Sau khi đóng: đăng sản phẩm, nhận đơn mua lẻ và yêu cầu đặt số lượng lớn.</li>
        </ul>
      </Card>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      {isFeePaid ? (
        <Card padding="md" className={styles.totalRow}>
          <p className={styles.subtitle}>Bạn đã đóng phí mở bán. Gian hàng đang hoạt động.</p>
          <ButtonLink to={routes.vendor.overview} variant="primary">
            Về tổng quan gian hàng
          </ButtonLink>
        </Card>
      ) : isApproved ? (
        <Card padding="md" className={styles.totalRow}>
          <div>
            <div className={styles.totalLabel}>Số tiền cần đóng</div>
            <div className={styles.totalValue}>
              {feeAmount === null ? '—' : formatCurrency(feeAmount)}
            </div>
          </div>
          <Button
            variant="primary"
            size="lg"
            loading={busy}
            disabled={feeAmount === null}
            onClick={handlePayFee}
          >
            Đóng phí qua VNPay
          </Button>
        </Card>
      ) : (
        vendor && (
          <Card padding="md" className={styles.totalRow}>
            <p className={styles.subtitle}>
              Bạn đóng phí được khi hồ sơ đã được duyệt. Trạng thái hiện tại:{' '}
              {VENDOR_STATUS_LABELS[vendor.status ?? 'PENDING']}.
            </p>
            <ButtonLink to={routes.vendor.overview} variant="outline">
              Xem trạng thái hồ sơ
            </ButtonLink>
          </Card>
        )
      )}
    </div>
  );
}
