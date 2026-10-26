import { useState } from 'react';
import { PageHeader, Steps } from '../../../shared/ui';
import { formatVnd } from '../../../shared/utils/money';
import { CHECKOUT_STEPS, cartTotals, groupByShop, type CartItem } from '../model/cartModel';

export interface CheckoutAddress {
  id: string;
  label: string;
  name: string;
  phone: string;
  text: string;
  isDefault: boolean;
}

export interface CheckoutInvoice {
  taxCode: string;
  email: string;
  company: string;
}

const TAX_CODE = /^\d{10}(\d{3})?$/;
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
  onPay: (address: CheckoutAddress, invoice: CheckoutInvoice | null) => void;
}) {
  const groups = groupByShop(items);
  const totals = cartTotals(groups);
  const [addressId, setAddressId] = useState(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id);
  const [wantInvoice, setWantInvoice] = useState(false);
  const [invoice, setInvoice] = useState<CheckoutInvoice>({ taxCode: '', email: '', company: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutInvoice, string>>>({});
  const [busy, setBusy] = useState(false);

  const pay = () => {
    const address = addresses.find((a) => a.id === addressId);
    if (!address) return;
    if (wantInvoice) {
      const next: typeof errors = {};
      if (!TAX_CODE.test(invoice.taxCode)) next.taxCode = 'Mã số thuế có 10 hoặc 13 chữ số.';
      if (!EMAIL.test(invoice.email)) next.email = 'Nhập email nhận hóa đơn, ví dụ ke-toan@congty.vn.';
      if (!invoice.company.trim()) next.company = 'Nhập tên công ty như trên đăng ký thuế.';
      setErrors(next);
      if (Object.keys(next).length) return;
    }
    setBusy(true);
    onPay(address, wantInvoice ? invoice : null);
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
      <div className="detail-layout">
        <div className="stack">
          <fieldset className="form-section panel panel--wide">
            <legend>1. Giao tới</legend>
            {addresses.map((a) => (
              <label key={a.id} className="choice">
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
              </div>
            )}
          </fieldset>
          <button type="button" className="mk-btn mk-btn--text" onClick={onBack}>
            ‹ Giỏ hàng
          </button>
        </div>
        <aside className="action-box" aria-labelledby="orders-heading">
          <h2 id="orders-heading" className="card-title-text">
            {groups.length} đơn trong lần thanh toán này
          </h2>
          <ul className="lines">
            {groups.map((g) => (
              <li key={g.shopId} className="lines__row">
                <span>
                  {g.shopName} · {g.items.length} món + giao
                </span>
                <span />
                <span className="mk-num">{formatVnd(g.goods + g.shippingFee)}</span>
              </li>
            ))}
            <li className="lines__row lines__row--total">
              <span>Tổng thanh toán</span>
              <span />
              <span className="mk-num">{formatVnd(totals.total)}</span>
            </li>
          </ul>
          <button type="button" className="mk-btn mk-btn--primary mk-btn--block" onClick={pay} disabled={!addressId} aria-busy={busy || undefined}>
            Thanh toán qua VNPay
          </button>
          <p className="muted">Bạn sẽ được chuyển sang VNPay.</p>
        </aside>
      </div>
    </div>
  );
}
