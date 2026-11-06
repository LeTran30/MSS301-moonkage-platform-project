import styles from './VendorFeePage.module.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Button, Card, Badge, Icon, Breadcrumbs, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useCurrentUser } from '@/entities/user';
import { useOwnVendorId, useRegistrationFeeConfig } from '@/entities/vendor';
import { usePayVendorFee } from '@/features/pay-vendor-fee';

export function VendorFeePage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const vendorId = useOwnVendorId(user.vendorId);
  const { busy, run, error } = useAction();
  const payVendorFee = usePayVendorFee(vendorId);

  // FR-53 / AC-26.9: the registration fee level in effect, shown before paying.
  const asyncFee = useRegistrationFeeConfig();
  const feeAmount = asyncFee.kind === 'loaded' ? asyncFee.data?.amount ?? 200000 : 200000;
  const [feePlan, setFeePlan] = useState<'SEASONAL'>('SEASONAL');

  function handlePayFee() {
    void run(async () => {
      // AC-27.4: `POST /api/vendors/{vendorId}/registration-fee-payments` answers
      // the VNPay page to open; the shop opens once the payment succeeds.
      const link = await payVendorFee();
      if (link?.paymentUrl) {
        toast.success('Đang chuyển tới cổng VNPay để nộp phí mở bán.');
        window.open(link.paymentUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      toast.success(
        `Đã khởi tạo lệnh nộp phí mở bán ${formatCurrency(feeAmount)}! Gian hàng sẽ mở khi thanh toán thành công.`
      );
      navigate(routes.vendor.overview);
    });
  }

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Kênh Xưởng', to: routes.vendor.overview },
          { label: 'Phí Mở Bán Gian Hàng' },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Kích Hoạt Gian Hàng & Phí Mở Bán (B1.1, AC-18)
          </h1>
          <p className={styles.subtitle}>
            Phí duy trì kiểm định chất lượng, gắn tem chống giả NFC và kết nối mạng lưới doanh nghiệp
          </p>
        </div>
        <Badge tone="gold" size="md">
          <Icon name="store" size={14} /> Kiểm định định kỳ
        </Badge>
      </div>

      <div className={styles.gridTwo}>
        <Card
          padding="lg"
          interactive
          className={`${styles.planCard} ${feePlan === 'SEASONAL' ? styles.planCardActive : ''}`}
          onClick={() => setFeePlan('SEASONAL')}
        >
          <div className={styles.planHeader}>
            <h2 className={styles.planTitle}>Phí Mở Bán Gian Hàng</h2>
            <Badge tone="gold">Phổ biến nhất</Badge>
          </div>
          <div className={styles.planPrice}>
            {formatCurrency(feeAmount)} <span className={styles.planPeriod}>/ lần mở bán</span>
          </div>
          <ul className={styles.planFeatures}>
            <li>Đăng tải không giới hạn sản phẩm bánh Trung Thu</li>
            <li>Nhận yêu cầu báo giá sỉ RFQ từ mạng lưới doanh nghiệp</li>
            <li>Cấp tem NFC chống hàng giả miễn phí đợt đầu</li>
            <li>Hỗ trợ trọng tài Escrow bảo lãnh thanh toán 100%</li>
          </ul>
          <Button variant={feePlan === 'SEASONAL' ? 'primary' : 'outline'} className={styles.planButton}>
            {feePlan === 'SEASONAL' ? 'Đang Chọn Gói Này' : 'Chọn Gói Này'}
          </Button>
        </Card>
      </div>

      {error && (
        <p role="alert" className={styles.subtitle}>
          {error}
        </p>
      )}

      <Card padding="md" className={styles.totalRow}>
        <div>
          <div className={styles.totalLabel}>Tổng phí thanh toán kích hoạt:</div>
          <div className={styles.totalValue}>{formatCurrency(feeAmount)}</div>
        </div>
        <Button variant="primary" size="lg" loading={busy} onClick={handlePayFee}>
          Thanh Toán & Kích Hoạt Gian Hàng Ngay
        </Button>
      </Card>
    </div>
  );
}

