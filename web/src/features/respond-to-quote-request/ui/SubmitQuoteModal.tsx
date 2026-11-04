import { useState } from 'react';
import { type QuoteRequest, type Quote } from '@/entities/request';
import { formatCurrency } from '@/shared/utils';
import { Button, Input, Modal, Select, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useSubmitQuote } from '../model/useSubmitQuote';
import styles from './SubmitQuoteModal.module.css';

interface Props {
  isOpen: boolean;
  request: QuoteRequest | null;
  onClose: () => void;
  onSubmit: (quote: Quote) => void;
}

/**
 * FR-38: the vendor sends the lines and the shipping fee; the server computes
 * every total, the deposit and the remainder (the client sends no amount).
 */
export function SubmitQuoteModal({ isOpen, request, onClose, onSubmit }: Props) {
  const [unitPrice, setUnitPrice] = useState('145000');
  const [depositPercent, setDepositPercent] = useState('40');
  const [shippingFee, setShippingFee] = useState('0');
  const [deliveryDate, setDeliveryDate] = useState('2026-11-08');
  const [deliveryMethod, setDeliveryMethod] = useState('Xe tải xưởng giao tận văn phòng');
  const [validDays, setValidDays] = useState('7');
  const [notes, setNotes] = useState(
    'Bao gồm dập nhũ vàng logo doanh nghiệp, khay lụa vàng và túi giấy cao cấp đi kèm.'
  );
  const { busy, run, error } = useAction();
  const submitQuote = useSubmitQuote();

  if (!request) return null;

  const quantity = request.quantity;
  const price = Number(unitPrice) || 0;
  const rate = Number(depositPercent) || 0;
  const fee = Number(shippingFee) || 0;
  const total = price * quantity + fee;

  function handleSubmit() {
    void run(async () => {
      const quote = await submitQuote(request!.id, {
        items: [
          {
            description: `${quantity} hộp bánh quà doanh nghiệp theo yêu cầu #${request!.id}`,
            quantity,
            unitPrice: price,
          },
        ],
        shippingFee: fee,
        depositRate: rate,
        deliveryDate,
        deliveryMethod,
        validDays: Math.min(14, Math.max(1, Number(validDays) || 7)),
        notes,
      });

      onSubmit(quote);
      toast.success(`Đã gửi báo giá ${formatCurrency(quote.unitPrice)}/hộp cho yêu cầu #${request!.id}!`);
      onClose();
    });
  }

  return (
    <Modal open={isOpen} onClose={onClose} title={`Gửi báo giá cho yêu cầu #${request.id}`}>
      <div className={styles.body}>
        <div className={styles.summary}>
          <strong>Doanh nghiệp:</strong> {request.buyerName} ({quantity} hộp)
          <br />
          <span>
            Tổng ước tính: <strong>{formatCurrency(total)}</strong> — cọc {rate}% (
            {formatCurrency(Math.floor((total * rate) / 100))})
          </span>
        </div>
        <Input
          label="Đơn giá đề xuất (VNĐ/hộp)"
          type="number"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          required
        />
        <Input
          label="Phí giao hàng (VNĐ)"
          type="number"
          value={shippingFee}
          onChange={(e) => setShippingFee(e.target.value)}
          required
        />
        <Input
          label="Tỷ lệ đặt cọc sản xuất (%) - Quy định B5.2"
          type="number"
          value={depositPercent}
          onChange={(e) => setDepositPercent(e.target.value)}
          required
        />
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
          label="Ghi chú & Cam kết tiêu chuẩn bao bì"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={busy}>
            Gửi báo giá
          </Button>
        </div>
      </div>
    </Modal>
  );
}
