import { useState, type FormEvent } from 'react';
import type { Address } from '@/entities/address';
import { ApiError } from '@/shared/api/client';
import { config } from '@/shared/config/env';
import { ALL_PROVINCE_NAMES, provinceCodeOf } from '@/shared/config/provinces';
import { getWardsForProvince } from '@/shared/config/wards';
import { saveAddress } from '../api/manageAddressesApi';
import styles from './AddressForm.module.css';

const DEMO_PROVINCES = ['Hà Nội', 'TP Hồ Chí Minh', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ'];
const PHONE = /^0[35789]\d{8}$/;

/** M6.3.1: add or edit one address. */
export function AddressForm({ address, onSaved, onCancel }: { address?: Address | null; onSaved: () => void; onCancel: () => void }) {
  const provinces = config.demoMode ? DEMO_PROVINCES : ALL_PROVINCE_NAMES;
  const initialProvince = address?.province ?? provinces[0];
  const initialWards = getWardsForProvince(provinceCodeOf(initialProvince));

  const [form, setForm] = useState({
    label: address?.label ?? '',
    name: address?.name ?? '',
    phone: address?.phone ?? '',
    province: initialProvince,
    ward: address?.ward ?? (initialWards[0]?.name || ''),
    line: address?.line ?? '',
    isDefault: address?.isDefault ?? false,
  });

  const availableWards = getWardsForProvince(provinceCodeOf(form.province));
  const currentWard = availableWards.some((w) => w.name === form.ward) ? form.ward : (availableWards[0]?.name || '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form, value: string | boolean) => setForm({ ...form, [key]: value });

  const onProvinceChange = (province: string) => {
    const nextWards = getWardsForProvince(provinceCodeOf(province));
    setForm((prev) => ({
      ...prev,
      province,
      ward: nextWards[0]?.name || '',
    }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Nhập họ tên người nhận.';
    if (!PHONE.test(form.phone.replace(/\s/g, ''))) next.phone = 'Số điện thoại có 10 chữ số, bắt đầu bằng 0.';
    if (!currentWard.trim()) next.ward = 'Chọn phường, xã hoặc thị trấn.';
    if (!form.line.trim()) next.line = 'Nhập số nhà, tên đường.';
    setErrors(next);
    setServerError(null);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await saveAddress({ ...form, ward: currentWard, label: form.label.trim() || 'Địa chỉ', id: address?.id });
      onSaved();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Máy chủ đang gặp lỗi. Thử lại sau ít phút.');
    } finally {
      setBusy(false);
    }
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
    <form className={`${styles.form} form`} onSubmit={submit} noValidate>
      <fieldset className={`${styles.section} form-section`}>
        <legend>Người nhận</legend>
        <div className={`${styles.fieldRow} field-row`}>
          {field('name', 'Họ tên')}
          {field('phone', 'Số điện thoại', undefined, 'tel')}
        </div>
      </fieldset>
      <fieldset className={`${styles.section} form-section`}>
        <legend>Địa chỉ</legend>
        <div className={`${styles.fieldRow} field-row`}>
          <div className="mk-field">
            <label htmlFor="addr-province">Tỉnh / thành phố</label>
            <select id="addr-province" value={form.province} onChange={(e) => onProvinceChange(e.target.value)}>
              {provinces.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className={`mk-field${errors.ward ? ' mk-field--error' : ''}`}>
            <label htmlFor="addr-ward">Phường / xã / thị trấn</label>
            <select
              id="addr-ward"
              value={currentWard}
              onChange={(e) => set('ward', e.target.value)}
              aria-invalid={errors.ward ? true : undefined}
            >
              {availableWards.map((w) => (
                <option key={w.code} value={w.name}>
                  {w.district ? `${w.name} (${w.district})` : w.name}
                </option>
              ))}
            </select>
            {errors.ward && <span className="mk-hint">{errors.ward}</span>}
          </div>
        </div>
        {field('line', 'Số nhà, tên đường', 'Ví dụ: 18 Hoàng Diệu, Toà nhà Landmark')}
        {field('label', 'Tên gợi nhớ', 'Hiện khi chọn địa chỉ ở thanh toán')}
        <label className="check">
          <input type="checkbox" checked={form.isDefault} onChange={(e) => set('isDefault', e.target.checked)} /> Đặt làm địa chỉ mặc định
        </label>
      </fieldset>
      {serverError && (
        <p className="error-text" role="alert">
          {serverError}
        </p>
      )}
      <div className={`${styles.actions} form-actions`}>
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
