import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { CustomTerms, DeliveryZones } from '@/entities/vendor';
import { routes } from '@/shared/config/routes';
import { KeyValue, PageHeader } from '@/shared/ui';
import { formatVnd } from '@/shared/utils/money';
import { saveTerms, saveZones } from '../api/editVendorSettingsApi';
import styles from './VendorSettingsForms.module.css';

/** B6.2: where the shop delivers; buyers outside these zones do not see its products. */
export function DeliveryZonesForm({
  zones,
  fees,
  onSaved,
}: {
  zones: DeliveryZones;
  fees: { province: string; fee: number }[];
  onSaved: () => void;
}) {
  const [form, setForm] = useState(zones);
  const [saved, setSaved] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await saveZones(form);
    setSaved(true);
    onSaved();
  };
  return (
    <div className="page">
      <PageHeader title="Vùng giao và phí giao" lead="Người mua ở ngoài các vùng này sẽ không thấy sản phẩm của bạn." />
      <div className={styles.formLayout}>
        <form className={styles.form} onSubmit={submit}>
          <fieldset className={styles.formSection}>
            <legend>Nội tỉnh · {form.homeProvince}</legend>
            <label className="check">
              <input type="checkbox" checked={form.homeAll} onChange={(e) => setForm({ ...form, homeAll: e.target.checked })} /> Giao toàn {form.homeProvince}
            </label>
            <div className="mk-field field-narrow">
              <label htmlFor="home-fee">Phí giao (đ)</label>
              <input id="home-fee" className="mk-num" inputMode="numeric" value={form.homeFee} onChange={(e) => setForm({ ...form, homeFee: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
            </div>
          </fieldset>
          <fieldset className={styles.formSection}>
            <legend>Liên tỉnh</legend>
            <label className="check">
              <input type="checkbox" checked={form.interProvince} onChange={(e) => setForm({ ...form, interProvince: e.target.checked })} /> Nhận giao liên tỉnh
            </label>
            <p className="muted">Phí theo bảng phí liên tỉnh của Moonkage. Bạn phải nhập mã vận đơn khi giao.</p>
            {form.interProvince && (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th scope="col">Tỉnh</th>
                    <th scope="col" className={styles.num}>
                      Phí
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((f) => (
                    <tr key={f.province}>
                      <td>{f.province}</td>
                      <td className={`${styles.num} mk-num`}>{formatVnd(f.fee)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="muted" colSpan={2}>
                      … 59 tỉnh khác
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </fieldset>
          <div className={styles.formActions}>
            {saved && (
              <span className="muted" role="status">
                Đã lưu.
              </span>
            )}
            <button type="submit" className="mk-btn mk-btn--primary">
              Lưu
            </button>
          </div>
        </form>
        <aside className={styles.sideNote}>
          <h2 className="card-title-text">Bước tiếp theo</h2>
          <p className="muted">Lưu xong, đăng sản phẩm đầu tiên hoặc khai điều kiện nhận đặt hàng.</p>
          <Link to={routes.vendor.terms} className="mk-btn mk-btn--text">
            Điều kiện nhận đặt hàng
          </Link>
        </aside>
      </div>
    </div>
  );
}

const CRUSTS = ['Nướng', 'Dẻo', 'Than tre'];
const FILLINGS = ['Thập cẩm', 'Hạt sen', 'Đậu xanh', 'Trà xanh'];
const CUSTOM = ['In / khắc logo lên hộp', 'Hộp theo thiết kế riêng', 'Thiệp kèm'];

/** B6.3: what the shop makes to order; Moonkage uses it to pick who receives a quote request. */
export function CustomTermsForm({ terms, onSaved }: { terms: CustomTerms; onSaved: () => void }) {
  const [form, setForm] = useState(terms);
  const [saved, setSaved] = useState(false);
  const toggle = (key: 'crusts' | 'fillings' | 'custom', v: string) =>
    setForm({ ...form, [key]: form[key].includes(v) ? form[key].filter((x) => x !== v) : [...form[key], v] });
  const setTier = (i: number, key: 'from' | 'to' | 'price', v: string) =>
    setForm({ ...form, tiers: form.tiers.map((t, j) => (j === i ? { ...t, [key]: v === '' && key === 'to' ? null : Number(v.replace(/\D/g, '')) || 0 } : t)) });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await saveTerms(form);
    setSaved(true);
    onSaved();
  };
  return (
    <div className="page">
      <PageHeader title="Điều kiện nhận đặt hàng" lead="Hiện trên trang đơn vị của bạn; Moonkage dùng để chọn ai nhận yêu cầu báo giá." />
      <div className={styles.formLayout}>
        <form className={styles.form} onSubmit={submit}>
          <fieldset className={styles.formSection}>
            <legend>1. Quy mô</legend>
            <div className={styles.fieldRow}>
              <div className="mk-field">
                <label htmlFor="min">Số hộp tối thiểu</label>
                <input id="min" className="mk-num" type="number" min={1} value={form.minBoxes} onChange={(e) => setForm({ ...form, minBoxes: Number(e.target.value) || 1 })} />
              </div>
              <div className="mk-field">
                <label htmlFor="mh">Gửi maket trong</label>
                <select id="mh" value={form.mockupHours} onChange={(e) => setForm({ ...form, mockupHours: Number(e.target.value) })}>
                  {[24, 48, 72].map((h) => (
                    <option key={h} value={h}>
                      {h} giờ
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>
          <fieldset className={styles.formSection}>
            <legend>2. Vỏ và nhân làm được</legend>
            <div className={styles.checkGroup}>
              <span className={styles.checkGroupLabel}>Vỏ</span>
              {CRUSTS.map((c) => (
                <label key={c} className="check">
                  <input type="checkbox" checked={form.crusts.includes(c)} onChange={() => toggle('crusts', c)} /> {c}
                </label>
              ))}
            </div>
            <div className={styles.checkGroup}>
              <span className={styles.checkGroupLabel}>Nhân</span>
              {FILLINGS.map((f) => (
                <label key={f} className="check">
                  <input type="checkbox" checked={form.fillings.includes(f)} onChange={() => toggle('fillings', f)} /> {f}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className={styles.formSection}>
            <legend>3. Làm riêng</legend>
            {CUSTOM.map((c) => (
              <label key={c} className="check">
                <input type="checkbox" checked={form.custom.includes(c)} onChange={() => toggle('custom', c)} /> {c}
              </label>
            ))}
          </fieldset>
          <fieldset className={styles.formSection}>
            <legend>4. Bậc giá gợi ý</legend>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th scope="col">Từ</th>
                  <th scope="col">Đến</th>
                  <th scope="col">Giá mỗi hộp (đ)</th>
                </tr>
              </thead>
              <tbody>
                {form.tiers.map((t, i) => (
                  <tr key={i}>
                    <td>
                      <input aria-label={`Bậc ${i + 1} từ`} className={`${styles.cellInput} mk-num`} value={t.from} onChange={(e) => setTier(i, 'from', e.target.value)} />
                    </td>
                    <td>
                      <input aria-label={`Bậc ${i + 1} đến`} className={`${styles.cellInput} mk-num`} value={t.to ?? ''} placeholder="—" onChange={(e) => setTier(i, 'to', e.target.value)} />
                    </td>
                    <td>
                      <input aria-label={`Bậc ${i + 1} giá`} className={`${styles.cellInput} mk-num`} value={t.price} onChange={(e) => setTier(i, 'price', e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              className="mk-btn mk-btn--quiet mk-btn--sm"
              onClick={() => setForm({ ...form, tiers: [...form.tiers, { from: (form.tiers.at(-1)?.to ?? 0) + 1, to: null, price: 0 }] })}
            >
              + Thêm bậc
            </button>
          </fieldset>
          <div className={styles.formActions}>
            {saved && (
              <span className="muted" role="status">
                Đã lưu.
              </span>
            )}
            <button type="submit" className="mk-btn mk-btn--primary">
              Lưu
            </button>
          </div>
        </form>
        <aside className={styles.sideNote}>
          <h2 className="card-title-text">Người mua sẽ thấy</h2>
          <KeyValue
            rows={[
              { label: 'Tối thiểu', value: `${form.minBoxes} hộp` },
              { label: 'Maket', value: `${form.mockupHours} giờ` },
              { label: 'Vỏ', value: form.crusts.join(', ') || '—' },
              { label: 'Nhân', value: form.fillings.join(', ') || '—' },
              { label: 'Làm riêng', value: form.custom.join(', ') || '—' },
            ]}
          />
        </aside>
      </div>
    </div>
  );
}
