import { useState } from 'react';
import { ApiError } from '@/shared/api/client';
import { cartTotals, groupByShop, type CartItem } from '@/entities/cart';
import { PageHeader, Steps } from '@/shared/ui';
import { formatVnd } from '@/shared/utils/money';
import { CHECKOUT_STEPS } from '../model/checkoutSteps';
import styles from './CheckoutView.module.css';

export interface CheckoutAddress {
  id: string;
  label: string;
  name: string;
  phone: string;
  text: string;
  /** 2-digit province code: decides each Shop's delivery fee (BR-30). */
  provinceCode: string;
  /** The address without its province, as the order records it. */
  detail: string;
  isDefault: boolean;
}

export interface CheckoutInvoice {
  taxCode: string;
  email: string;
  company: string;
  address: string;
}

/** As order-service checks it (AC-24.3): 10 digits, a branch suffix -XXX, or 12 digits. */
const TAX_CODE = /^(\d{10}(-\d{3})?|\d{12})$/;
const PAY_FAILED_MSG = 'Chưa tạo được lần thanh toán. Thử lại sau ít phút.';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** M4.1: where to deliver, an optional company invoice, then pay every shop's order in one VNPay payment. */
export function CheckoutView({
  items,
  addresses,
  onAddAddress,
  onBack,
  onPay,
}: {
  items: CartItem[];
  addresses: CheckoutAddress[];
  onAddAddress: () => void;
  onBack: () => void;
  onPay: (address: CheckoutAddress, invoice: CheckoutInvoice | null) => Promise<void>;
}) {
  const groups = groupByShop(items);
  const totals = cartTotals(groups);
  const [addressId, setAddressId] = useState(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id);
  const [wantInvoice, setWantInvoice] = useState(false);
  const [invoice, setInvoice] = useState<CheckoutInvoice>({ taxCode: '', email: '', company: '', address: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutInvoice, string>>>({});
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const pay = async () => {
    const address = addresses.find((a) => a.id === addressId);
    if (!address) return;
    if (wantInvoice) {
      const next: typeof errors = {};
      if (!TAX_CODE.test(invoice.taxCode.trim())) next.taxCode = 'Mã số thuế có 10 chữ số (chi nhánh thêm -XXX) hoặc 12 chữ số.';
      if (!EMAIL.test(invoice.email)) next.email = 'Nhập email nhận hóa đơn, ví dụ ke-toan@congty.vn.';
      if (!invoice.company.trim()) next.company = 'Nhập tên công ty như trên đăng ký thuế.';
      if (!invoice.address.trim()) next.address = 'Nhập địa chỉ công ty như trên đăng ký thuế.';
      setErrors(next);
      if (Object.keys(next).length) return;
    }
    setBusy(true);
    setPayError(null);
    try {
      await onPay(address, wantInvoice ? invoice : null);
    } catch (e) {
      setPayError(e instanceof ApiError ? e.message : PAY_FAILED_MSG);
      setBusy(false);
    }
  };

  const invoiceField = (key: keyof CheckoutInvoice, label: string, type = 'text') => (
    <div className={`mk-field${errors[key] ? ' mk-field--error' : ''}`}>
      <label htmlFor={`inv-${key}`}>{label}</label>
      <input
        id={`inv-${key}`}
        type={type}
        className={key === 'taxCode' ? 'mk-num' : undefined}
        value={invoice[key]}
        onChange={(e) => setInvoice({ ...invoice, [key]: e.target.value })}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] ? `inv-${key}-err` : undefined}
      />
      {errors[key] && (
        <span className="mk-hint" id={`inv-${key}-err`}>
          {errors[key]}
        </span>
      )}
    </div>
  );

  return (
    <div className="page">
      <PageHeader title="Thanh toán" />
      <Steps label="Các bước thanh toán" steps={CHECKOUT_STEPS} current={1} />
      <div className={`${styles.detailLayout} detail-layout`}>
        <div className="stack">
          <fieldset className="form-section panel panel--wide">
            <legend>1. Giao tới</legend>
            {addresses.map((a) => (
              <label key={a.id} className={`${styles.choice} choice`}>
                <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                <span>
                  <strong>{a.label}</strong> · {a.name} · {a.phone}
                  <br />
                  <span className="muted">{a.text}</span>
                </span>
              </label>
            ))}
            <button type="button" className="mk-btn mk-btn--quiet mk-btn--sm" onClick={onAddAddress}>
              + Thêm địa chỉ
            </button>
          </fieldset>
          <fieldset className="form-section panel panel--wide">
            <legend>2. Hóa đơn doanh nghiệp</legend>
            <label className="check">
              <input type="checkbox" checked={wantInvoice} onChange={(e) => setWantInvoice(e.target.checked)} /> Xuất hóa đơn công ty cho mọi đơn trong lần thanh
              toán này
            </label>
            {wantInvoice && (
              <div className="stack">
                <div className="field-row">
                  {invoiceField('taxCode', 'Mã số thuế')}
                  {invoiceField('email', 'Email nhận hóa đơn', 'email')}
                </div>
                {invoiceField('company', 'Tên công ty')}
                {invoiceField('address', 'Địa chỉ công ty')}
              </div>
            )}
          </fieldset>
          <button type="button" className="mk-btn mk-btn--text" onClick={onBack}>
            ‹ Giỏ hàng
          </button>
        </div>
        <aside className={`${styles.actionBox} action-box`} aria-labelledby="orders-heading">
          <h2 id="orders-heading" className="card-title-text">
            {groups.length} đơn trong lần thanh toán này
          </h2>
          <ul className={`${styles.lines} lines`}>
            {groups.map((g) => (
              <li key={g.shopId} className={`${styles.linesRow} lines__row`}>
                <span>
                  {g.shopName} · {g.items.length} món + giao
                </span>
                <span />
                <span className="mk-num">{formatVnd(g.goods + g.shippingFee)}</span>
              </li>
            ))}
            <li className={`${styles.linesRow} ${styles.linesRowTotal} lines__row lines__row--total`}>
              <span>Tổng thanh toán</span>
              <span />
              <span className="mk-num">{formatVnd(totals.total)}</span>
            </li>
          </ul>
          <button type="button" className="mk-btn mk-btn--primary mk-btn--block" onClick={pay} disabled={!addressId || busy} aria-busy={busy || undefined}>
            Thanh toán qua VNPay
          </button>
          {payError && (
            <p className="error-text" role="alert">
              {payError}
            </p>
          )}
          <p className="muted">Bạn sẽ được chuyển sang VNPay.</p>
        </aside>
      </div>
    </div>
  );
}
