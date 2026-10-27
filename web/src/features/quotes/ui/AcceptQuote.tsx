import { useState } from 'react';
import { KeyValue, PageHeader, Steps } from '../../../shared/ui';
import { formatVnd } from '../../../shared/utils/money';
import { deposit } from '../model/quoteModel';
import type { Quote, QuoteRequest } from '../model/useQuotes';
import styles from './AcceptQuote.module.css';

/** M6.2.2: the chosen quote, the binding agreement, and the deposit (paid on VNPay by the page). */
export function AcceptQuote({
  request,
  quote,
  onBack,
  onPay,
  invoiceCompany,
}: {
  request: QuoteRequest;
  quote: Quote;
  onBack: () => void;
  onPay: (withInvoice: boolean) => void;
  invoiceCompany?: string;
}) {
  const [agree, setAgree] = useState(false);
  const [invoice, setInvoice] = useState(Boolean(invoiceCompany));
  return (
    <div className="page">
      <PageHeader title="Chấp nhận báo giá và đặt cọc" />
      <Steps label="Các bước" steps={['So sánh báo giá', 'Xác nhận và đặt cọc', 'Thanh toán VNPay', 'Đơn được tạo']} current={1} />
      <div className={styles.detailLayout}>
        <div className="stack">
          <section className="panel panel--wide" aria-labelledby="quote-of">
            <div className="row-between">
              <h2 id="quote-of" className="card-title-text">
                Báo giá của {quote.supplierName}
              </h2>
              <button type="button" className="mk-btn mk-btn--text" onClick={onBack}>
                Đổi báo giá
              </button>
            </div>
            <KeyValue
              rows={[
                { label: 'Số hộp', value: `${quote.boxes} hộp × ${request.perBox}` },
                { label: 'Làm riêng', value: quote.custom },
                { label: 'Giao trước', value: `${quote.deliverBy} · ${request.deliverTo}` },
                { label: 'Maket', value: 'Đơn vị gửi trong 24 giờ sau khi nhận cọc' },
              ]}
            />
          </section>
          <fieldset className="form-section panel panel--wide">
            <legend>Xác nhận</legend>
            <label className="check">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> Tôi đồng ý với báo giá và cách giữ tiền: Moonkage giữ tiền
              cọc, chỉ giải ngân cho đơn vị theo tiến độ.
            </label>
            {invoiceCompany && (
              <label className="check">
                <input type="checkbox" checked={invoice} onChange={(e) => setInvoice(e.target.checked)} /> Xuất hóa đơn công ty (dùng thông tin đã lưu:{' '}
                {invoiceCompany})
              </label>
            )}
          </fieldset>
          <button type="button" className="mk-btn mk-btn--text" onClick={onBack}>
            ‹ Quay lại so sánh
          </button>
        </div>
        <aside className={styles.actionBox} aria-labelledby="pay-heading">
          <h2 id="pay-heading" className="card-title-text">
            Thanh toán
          </h2>
          <ul className={styles.lines}>
            <li className={styles.lineRow}>
              <span>Giá trị đơn</span>
              <span />
              <span className="mk-num">{formatVnd(quote.total)}</span>
            </li>
            <li className={`${styles.lineRow} ${styles.lineTotal}`}>
              <span>Đặt cọc bây giờ ({quote.depositPercent}%)</span>
              <span />
              <span className="mk-num">{formatVnd(deposit(quote))}</span>
            </li>
            <li className={styles.lineRow}>
              <span>Trả sau khi giao</span>
              <span />
              <span className="mk-num">{formatVnd(quote.total - deposit(quote))}</span>
            </li>
          </ul>
          <button type="button" className="mk-btn mk-btn--primary mk-btn--block" disabled={!agree} onClick={() => onPay(invoice)}>
            Đặt cọc qua VNPay
          </button>
          {!agree && <p className="muted">Đánh dấu ô đồng ý để đặt cọc.</p>}
        </aside>
      </div>
    </div>
  );
}
