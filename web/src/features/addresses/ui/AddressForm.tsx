import { useState, type FormEvent } from 'react';
import { saveAddress, type Address } from '../api/addressesApi';

const PROVINCES = ['Hà Nội', 'TP Hồ Chí Minh', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ'];
const PHONE = /^0\d{9}$/;

/** M6.3.1: add or edit one address. */
export function AddressForm({ address, onSaved, onCancel }: { address?: Address | null; onSaved: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    label: address?.label ?? '',
    name: address?.name ?? '',
    phone: address?.phone ?? '',
    province: address?.province ?? PROVINCES[0],
    line: address?.line ?? '',
    isDefault: address?.isDefault ?? false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form, value: string | boolean) => setForm({ ...form, [key]: value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Nhập họ tên người nhận.';
    if (!PHONE.test(form.phone.replace(/\s/g, ''))) next.phone = 'Số điện thoại có 10 chữ số, bắt đầu bằng 0.';
    if (!form.line.trim()) next.line = 'Nhập số nhà, đường, phường.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    await saveAddress({ ...form, label: form.label.trim() || 'Địa chỉ', id: address?.id });
    onSaved();
  };

  const field = (key: 'name' | 'phone' | 'line' | 'label', label: string, hint?: string, type = 'text') => (
    <div className={`mk-field${errors[key] ? ' mk-field--error' : ''}`}>
      <label htmlFor={`addr-${key}`}>{label}</label>
      <input
        id={`addr-${key}`}
        type={type}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] || hint ? `addr-${key}-hint` : undefined}
      />
      {(errors[key] || hint) && (
        <span className="mk-hint" id={`addr-${key}-hint`}>
          {errors[key] ?? hint}
        </span>
      )}
    </div>
  );

  return (
    <form className="form" onSubmit={submit} noValidate>
      <fieldset className="form-section">
        <legend>Người nhận</legend>
        <div className="field-row">
          {field('name', 'Họ tên')}
          {field('phone', 'Số điện thoại', undefined, 'tel')}
        </div>
      </fieldset>
      <fieldset className="form-section">
        <legend>Địa chỉ</legend>
        <div className="mk-field">
          <label htmlFor="addr-province">Tỉnh / thành phố</label>
          <select id="addr-province" value={form.province} onChange={(e) => set('province', e.target.value)}>
            {PROVINCES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        {field('line', 'Số nhà, đường, phường')}
        {field('label', 'Tên gợi nhớ', 'Hiện khi chọn địa chỉ ở thanh toán')}
        <label className="check">
          <input type="checkbox" checked={form.isDefault} onChange={(e) => set('isDefault', e.target.checked)} /> Đặt làm địa chỉ mặc định
        </label>
      </fieldset>
      <div className="form-actions">
        <button type="button" className="mk-btn mk-btn--quiet" onClick={onCancel}>
          Hủy
        </button>
        <button type="submit" className="mk-btn mk-btn--primary" aria-busy={busy || undefined}>
          Lưu địa chỉ
        </button>
      </div>
    </form>
  );
}
