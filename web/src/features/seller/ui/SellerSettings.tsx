import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { KeyValue, PageHeader, StatusBadge } from '../../../shared/ui';
import { formatVnd } from '../../../shared/utils/money';
import { resubmitProfile, saveTerms, saveZones, type CustomTerms, type DeliveryZones, type SellerProfile } from '../model/useSeller';
import styles from './SellerSettings.module.css';

/** B6.0 */
export function SettingsHub({ profile }: { profile: SellerProfile }) {
  const open = profile.state === 'open';
  const rows = [
    { title: 'Thông tin pháp lý', body: 'Hồ sơ đã nộp, hóa đơn phí mở bán', badge: open ? 'Đã duyệt · chỉ xem' : 'Chờ duyệt', to: routes.sellerLegal, enabled: true },
    { title: 'Vùng giao và phí giao', body: 'Nơi Shop giao tới và phí từng vùng', badge: open ? 'Đã cài' : 'Mở sau khi duyệt', to: routes.sellerZones, enabled: open },
    { title: 'Điều kiện nhận đặt hàng', body: 'Số hộp tối thiểu, vỏ và nhân làm được, thời gian maket', badge: open ? 'Đã cài' : 'Mở sau khi duyệt', to: routes.sellerTerms, enabled: open },
    { title: 'Lịch công suất', body: 'Số hộp nhận được mỗi ngày', badge: 'Hoãn trong demo', to: routes.sellerCapacity, enabled: true },
  ];
  return (
    <div className="page">
      <PageHeader title="Cài đặt bán hàng" />
      <ul className={styles.rowList}>
        {rows.map((r) => (
          <li key={r.title} className={styles.rowItem}>
            <div className={styles.rowMain}>
              <p className={styles.rowTitle}>{r.title}</p>
              <p className="muted">{r.body}</p>
            </div>
            <StatusBadge tone={r.enabled ? 'soft' : 'muted'}>{r.badge}</StatusBadge>
            {r.enabled ? (
              <Link to={r.to} className="mk-btn mk-btn--quiet mk-btn--sm">
                Mở
              </Link>
            ) : (
              <button type="button" className="mk-btn mk-btn--sm" disabled>
                Mở
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** B6.1: the submitted profile, read-only once approved; re-submit when more is needed. */
export function LegalInfo({ profile, onChanged }: { profile: SellerProfile; onChanged: () => void }) {
  return (
    <div className="page page--narrow">
      <PageHeader
        title="Thông tin pháp lý"
        lead={
          <>
            {profile.shopName} · {profile.kind.toLowerCase()}{' '}
            {profile.state === 'open' || profile.state === 'approved' ? (
              <StatusBadge tone="ok">{`Đã duyệt ${profile.approvedAt ?? ''} · chỉ xem`}</StatusBadge>
            ) : profile.state === 'needs-more' ? (
              <StatusBadge tone="warn">Cần bổ sung</StatusBadge>
            ) : (
              <StatusBadge tone="soft">Chờ duyệt · chỉ xem</StatusBadge>
            )}
          </>
        }
      />
      {profile.state === 'needs-more' && (
        <div className="notice row-between">
          <span>Moonkage cần: {profile.moreNeeded}</span>
          <button
            type="button"
            className="mk-btn mk-btn--primary mk-btn--sm"
            onClick={async () => {
              await resubmitProfile();
              onChanged();
            }}
          >
            Nộp lại
          </button>
        </div>
      )}
      <section className="panel panel--wide" aria-labelledby="unit-h">
        <h2 id="unit-h" className="detail-heading">
          Đơn vị
        </h2>
        <KeyValue
          rows={[
            { label: 'Tên', value: profile.shopName },
            { label: 'Mã đăng ký', value: profile.regNo },
            { label: 'Địa chỉ', value: profile.address },
          ]}
        />
      </section>
      <section className="panel panel--wide" aria-labelledby="owner-h">
        <h2 id="owner-h" className="detail-heading">
          Chủ hộ
        </h2>
        <KeyValue
          rows={[
            { label: 'Họ tên', value: profile.ownerName },
            { label: 'Số định danh', value: profile.ownerId },
          ]}
        />
      </section>
      <section className="panel panel--wide" aria-labelledby="docs-h">
        <h2 id="docs-h" className="detail-heading">
          Giấy tờ
        </h2>
        <ul className={styles.rowList}>
          {['Giấy đăng ký hộ kinh doanh', 'Giấy an toàn thực phẩm', ...(profile.state === 'open' ? [`Hóa đơn phí mở bán ${formatVnd(200000)}`] : [])].map((d) => (
            <li key={d} className={styles.rowItem}>
              <span className="mk-badge">PDF</span>
              <span className={styles.rowMain}>{d}</span>
              <button type="button" className="mk-btn mk-btn--text">
                {d.startsWith('Hóa đơn') ? 'Tải' : 'Xem'}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

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
          <Link to={routes.sellerTerms} className="mk-btn mk-btn--text">
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

/** B6.4 (deferred in the demo) */
export function CapacityDeferred() {
  return (
    <div className="page page--narrow">
      <StatusBadge tone="muted">Hoãn trong demo</StatusBadge>
      <PageHeader title="Lịch công suất" lead="Chưa làm trong bản demo (FR-37)." />
      <Link to={routes.sellerSettings} className="mk-btn mk-btn--quiet">
        ‹ Cài đặt bán hàng
      </Link>
    </div>
  );
}
