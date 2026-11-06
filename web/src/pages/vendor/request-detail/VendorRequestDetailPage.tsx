import styles from './VendorRequestDetailPage.module.css';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Badge, Breadcrumbs, Button, ButtonLink, Card, Input, Select, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useQuoteRequest } from '@/entities/request';
import { useSubmitQuote } from '@/features/respond-to-quote-request';

export function VendorRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const requestId = id || '';

  const asyncRequest = useQuoteRequest(requestId);
  const req = asyncRequest.kind === 'loaded' ? asyncRequest.data : null;

  const [pricePerBox, setPricePerBox] = useState<string>('160000');
  const [shippingFee, setShippingFee] = useState<string>('0');
  const [depositPercent, setDepositPercent] = useState<string>('40');
  const [deliveryDate, setDeliveryDate] = useState<string>('2026-11-08');
  const [deliveryMethod, setDeliveryMethod] = useState<string>('Xe tải xưởng giao tận văn phòng');
  const [validDays, setValidDays] = useState<string>('7');
  const [note, setNote] = useState(
    'Hộp quà cao cấp ép kim logo, tặng kèm túi giấy đỏ sang trọng. Đã bao gồm tem NFC chống giả.'
  );
  const { busy, run, error } = useAction();
  const submitQuote = useSubmitQuote();

  if (asyncRequest.kind === 'loading') {
    return <p role="status">Đang tải yêu cầu báo giá…</p>;
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
        <ButtonLink to={routes.vendor.requests}>Về danh sách yêu cầu</ButtonLink>
      </div>
    );
  }

  const quantity = req.quantity;
  const price = Number(pricePerBox) || 0;
  const fee = Number(shippingFee) || 0;
  const rate = Number(depositPercent) || 0;
  const totalQuote = price * quantity + fee;

  function handleSubmitQuote(e: React.FormEvent) {
    e.preventDefault();
    void run(async () => {
      // FR-38: the client sends the lines and the shipping fee; the server
      // computes the total, the deposit and the remainder.
      await submitQuote(req!.id, {
        items: [
          {
            description: `${quantity} hộp quà doanh nghiệp theo yêu cầu #${req!.id}`,
            quantity,
            unitPrice: price,
          },
        ],
        shippingFee: fee,
        depositRate: rate,
        deliveryDate,
        deliveryMethod,
        validDays: Math.min(14, Math.max(1, Number(validDays) || 7)),
        notes: note,
      });
      toast.success(`Đã gửi báo giá ${formatCurrency(price)}/hộp cho yêu cầu #${req!.id}!`);
      asyncRequest.reload();
    });
  }

  return (
    <div className={styles.container}>
      <Breadcrumbs
        items={[
          { label: 'Kênh Xưởng', to: routes.vendor.overview },
          { label: 'Yêu cầu báo giá sỉ (RFQ)', to: routes.vendor.requests },
          { label: `Yêu cầu #${req.id}` },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Chi Tiết RFQ #{req.id} (B3.1, B3.2)</h1>
          <p className={styles.subtitle}>Doanh nghiệp: {req.buyerName}</p>
        </div>
        <Badge tone="gold" size="md">
          {req.quantity} hộp bánh Trung Thu
        </Badge>
      </div>

      <div className={styles.grid}>
        <Card padding="lg" className={styles.card}>
          <h2 className={styles.cardTitle}>Yêu Cầu Từ Doanh Nghiệp</h2>
          <div className={styles.specList}>
            <div className={styles.specRow}>
              <span>Mục tiêu:</span>
              <strong>{req.customRequirements || 'Đặt bánh theo yêu cầu'}</strong>
            </div>
            <div className={styles.specRow}>
              <span>Thời hạn nhận bánh:</span>
              <strong>{req.deliveryDeadline}</strong>
            </div>
            <div className={styles.specRow}>
              <span>Ngân sách mục tiêu:</span>
              <span>{req.budgetPerBox ? `${formatCurrency(req.budgetPerBox)} / hộp` : 'Chưa định'}</span>
            </div>
            <div className={styles.specRow}>
              <span>Địa điểm nhận hàng:</span>
              <span>
                {req.deliveryAddress}, {req.deliveryProvince}
              </span>
            </div>
          </div>

          <div>
            <div className={styles.noteLabel}>Ghi chú yêu cầu riêng của doanh nghiệp:</div>
            <div className={styles.noteBox}>
              "{req.customRequirements || 'Cần in logo thương hiệu của công ty lên nắp hộp, 4 vị nhân truyền thống ít ngọt cho khối văn phòng.'}"
            </div>
          </div>
        </Card>

        <Card padding="lg" className={styles.card}>
          <h2 className={styles.cardTitle}>Gửi Báo Giá Chào Hàng Cạnh Tranh</h2>
          <form onSubmit={handleSubmitQuote} className={styles.form}>
            <Input
              label="Đơn giá đề xuất (VNĐ / hộp) *"
              type="number"
              value={pricePerBox}
              onChange={(e) => setPricePerBox(e.target.value)}
              min={50000}
              step={5000}
              required
            />

            <div className={styles.formRow}>
              <Input
                label="Phí giao hàng (VNĐ)"
                type="number"
                value={shippingFee}
                onChange={(e) => setShippingFee(e.target.value)}
                min={0}
              />
              <Input
                label="Tỷ lệ đặt cọc (%)"
                type="number"
                value={depositPercent}
                onChange={(e) => setDepositPercent(e.target.value)}
                min={1}
                max={100}
                required
              />
            </div>

            <div className={styles.formRow}>
              <Input
                label="Ngày giao hàng cam kết"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
              />
              <Select
                label="Phương thức giao hàng"
                options={[
                  { value: 'Xe tải xưởng giao tận văn phòng', label: 'Xe tải xưởng giao tận văn phòng' },
                  { value: 'Giao hàng chuyên nghiệp', label: 'Giao hàng chuyên nghiệp' },
                  { value: 'Khách tự đến xưởng lấy', label: 'Khách tự đến xưởng lấy' },
                ]}
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value)}
                required
              />
            </div>

            <Input
              label="Báo giá có hiệu lực (số ngày, 1–14)"
              type="number"
              min={1}
              max={14}
              value={validDays}
              onChange={(e) => setValidDays(e.target.value)}
              required
            />

            <Input
              label="Cam kết quy cách đóng gói & hương vị"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <div className={styles.totalRow}>
              <span>Tổng giá trị báo giá ({req.quantity} hộp):</span>
              <strong className={styles.totalValue}>{formatCurrency(totalQuote)}</strong>
            </div>
            <Button type="submit" variant="primary" className={styles.submitBtn} loading={busy}>
              Gửi Báo Giá Cho Doanh Nghiệp
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

