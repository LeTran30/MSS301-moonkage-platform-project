import { useState } from 'react';
import type { Payment } from '@/entities/payment';
import { KeyValue } from '@/shared/ui';
import { formatVnd } from '@/shared/utils/money';
import styles from './VnpayGateway.module.css';

/** M4.2: stand-in for the VNPay sandbox page, clearly outside Moonkage. */
export function VnpayGateway({ payment, onResult }: { payment: Payment; onResult: (paid: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const answer = (paid: boolean) => {
    setBusy(true);
    onResult(paid);
  };
  return (
    <div className={`${styles.vnpay} vnpay`}>
      <p className={`${styles.flag} vnpay__flag`}>Giả lập · ngoài hệ thống Moonkage</p>
      <h1 className="title-text">Cổng VNPay</h1>
      <KeyValue
        rows={[
          { label: 'Thanh toán cho', value: 'Moonkage' },
          { label: 'Nội dung', value: payment.description },
          { label: 'Số tiền', value: <span className="mk-price">{formatVnd(payment.amount)}</span> },
          { label: 'Mã giao dịch', value: payment.id },
        ]}
      />
      <div className={`${styles.qr} vnpay__qr`} aria-hidden="true">
        Mã QR
      </div>
      <div className="row">
        <button type="button" className="mk-btn mk-btn--primary" disabled={busy} onClick={() => answer(true)}>
          Giả lập: thanh toán thành công
        </button>
        <button type="button" className="mk-btn mk-btn--quiet" disabled={busy} onClick={() => answer(false)}>
          Giả lập: hủy, quay về Moonkage
        </button>
      </div>
    </div>
  );
}
