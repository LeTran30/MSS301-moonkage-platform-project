import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { LoadingState, ErrorState, PageHeader, StatusBadge } from '../../../shared/ui';
import { formatVnd } from '../../../shared/utils/money';
import { missingFees } from '../model/adminModel';
import {
  saveProvinceFees,
  saveSellerFee,
  saveTaxonomy,
  useProvinceFees,
  useSellerFeeConfig,
  useTaxonomy,
  type ProvinceFee,
  type Taxonomy,
} from '../model/useAdmin';
import styles from './AdminConfig.module.css';

/** Q6.0 */
export function ConfigHub() {
  const items = [
    { to: routes.adminProvinceFees, title: 'Phí liên tỉnh', text: 'Phí giao hộp tới từng tỉnh, thành.' },
    { to: routes.adminSellerFee, title: 'Phí mở bán', text: 'Người bán đóng một lần trước khi mở bán.' },
    { to: routes.adminVouchers, title: 'Voucher', text: 'Chưa làm ở bản này.', deferred: true },
    { to: routes.adminTaxonomy, title: 'Vỏ và nhân', text: 'Danh mục để người bán chọn và người mua lọc.' },
  ];
  return (
    <div className="page">
      <PageHeader title="Cấu hình" />
      <div className={styles.statGrid}>
        {items.map((i) => (
          <Link key={i.to} to={i.to} className={styles.statTile}>
            <span className="card-title-text">
              {i.title} {i.deferred && <StatusBadge tone="muted">Hoãn</StatusBadge>}
            </span>
            <span className="muted">{i.text}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ProvinceFeeTable({ initial }: { initial: ProvinceFee[] }) {
  const [fees, setFees] = useState(initial);
  const [saved, setSaved] = useState(false);
  const missing = missingFees(fees);
  const set = (province: string, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    setFees(fees.map((f) => (f.province === province ? { ...f, fee: digits ? Number(digits) : null } : f)));
    setSaved(false);
  };
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (missing.length) return;
        await saveProvinceFees(fees);
        setSaved(true);
      }}
    >
      {missing.length > 0 && (
        <p className="notice" role="status">
          Còn {missing.length} tỉnh chưa có phí: {missing.join(', ')}. Chưa lưu được.
        </p>
      )}
      <div className={styles.feeGrid}>
        {fees.map((f) => (
          <div key={f.province} className={`mk-field${f.fee === null ? ' mk-field--error' : ''}`}>
            <label htmlFor={`fee-${f.province}`}>{f.province}</label>
            <input id={`fee-${f.province}`} inputMode="numeric" value={f.fee ?? ''} placeholder="Chưa có" onChange={(e) => set(f.province, e.target.value)} />
          </div>
        ))}
      </div>
      <div className="row">
        <button type="submit" className="mk-btn mk-btn--primary" disabled={missing.length > 0}>
          Lưu bảng phí
        </button>
        {saved && <span role="status">Đã lưu. Áp dụng cho đơn tạo từ bây giờ.</span>}
      </div>
    </form>
  );
}

/** Q6.1: 34 provinces after the 2025 merger; can not be saved while one is missing. */
export function ProvinceFees() {
  const state = useProvinceFees();
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  return (
    <div className="page">
      <PageHeader eyebrow="Cấu hình" title="Phí liên tỉnh" lead={`${state.data.length} tỉnh, thành · đồng mỗi hộp · đơn đã tạo giữ phí cũ`} />
      <ProvinceFeeTable initial={state.data} />
    </div>
  );
}

function SellerFeeForm({ initial }: { initial: number }) {
  const [fee, setFee] = useState(initial);
  const [saved, setSaved] = useState(false);
  return (
    <form
      className="stack page--narrow"
      onSubmit={async (e) => {
        e.preventDefault();
        await saveSellerFee(fee);
        setSaved(true);
      }}
    >
      <div className="mk-field">
        <label htmlFor="sfee">Phí mở bán (đồng)</label>
        <input
          id="sfee"
          inputMode="numeric"
          value={fee}
          onChange={(e) => {
            setFee(Number(e.target.value.replace(/\D/g, '')) || 0);
            setSaved(false);
          }}
        />
        <span className="mk-hint">Hiện hiển thị: {formatVnd(fee)}. Người đã đóng không bị ảnh hưởng.</span>
      </div>
      <div className="row">
        <button type="submit" className="mk-btn mk-btn--primary" disabled={fee <= 0}>
          Lưu
        </button>
        {saved && <span role="status">Đã lưu.</span>}
      </div>
    </form>
  );
}

/** Q6.2 */
export function SellerFeeConfig() {
  const state = useSellerFeeConfig();
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  return (
    <div className="page">
      <PageHeader eyebrow="Cấu hình" title="Phí mở bán" />
      <SellerFeeForm initial={state.data} />
    </div>
  );
}

/** Q6.3: deferred in this release. */
export function VoucherDeferred() {
  return (
    <div className="page page--narrow">
      <PageHeader eyebrow="Cấu hình" title="Voucher" lead="Chưa làm ở bản này. Đặc tả hoãn voucher tới sau khi có dữ liệu đơn thật." />
      <Link to={routes.adminConfig} className="mk-btn mk-btn--quiet">
        Về Cấu hình
      </Link>
    </div>
  );
}

type Group = keyof Taxonomy;

function TaxonomyEditor({ initial }: { initial: Taxonomy }) {
  const [tax, setTax] = useState(initial);
  const [drafts, setDrafts] = useState<Record<Group, string>>({ crusts: '', fillings: '' });
  const [saved, setSaved] = useState(false);
  const update = (next: Taxonomy) => {
    setTax(next);
    setSaved(false);
  };
  const toggle = (g: Group, name: string) => update({ ...tax, [g]: tax[g].map((i) => (i.name === name ? { ...i, visible: !i.visible } : i)) });
  const add = (g: Group) => {
    const name = drafts[g].trim();
    if (!name || tax[g].some((i) => i.name.toLowerCase() === name.toLowerCase())) return;
    update({ ...tax, [g]: [...tax[g], { name, visible: true }] });
    setDrafts({ ...drafts, [g]: '' });
  };
  const group = (g: Group, title: string) => {
    const visible = tax[g].filter((i) => i.visible).length;
    return (
      <section className="panel stack" aria-labelledby={`tx-${g}`}>
        <h2 id={`tx-${g}`} className="detail-heading">
          {title} <span className="muted">· {visible} đang hiện</span>
        </h2>
        <ul className="plain-list">
          {tax[g].map((i) => {
            const last = i.visible && visible === 1;
            return (
              <li key={i.name} className="row-between">
                <span className={i.visible ? '' : 'muted'}>{i.name}</span>
                <button
                  type="button"
                  className="mk-btn mk-btn--text mk-btn--sm"
                  disabled={last}
                  title={last ? 'Phải còn ít nhất một mục đang hiện' : undefined}
                  onClick={() => toggle(g, i.name)}
                >
                  {i.visible ? 'Ẩn' : 'Hiện'}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="row">
          <input className={styles.cellInput} aria-label={`Thêm ${title.toLowerCase()}`} placeholder="Tên mới" value={drafts[g]} onChange={(e) => setDrafts({ ...drafts, [g]: e.target.value })} />
          <button type="button" className="mk-btn mk-btn--quiet mk-btn--sm" disabled={!drafts[g].trim()} onClick={() => add(g)}>
            Thêm
          </button>
        </div>
      </section>
    );
  };
  return (
    <div className="stack">
      <div className="grid-2">
        {group('crusts', 'Vỏ')}
        {group('fillings', 'Nhân')}
      </div>
      <div className="row">
        <button
          type="button"
          className="mk-btn mk-btn--primary"
          onClick={async () => {
            await saveTaxonomy(tax);
            setSaved(true);
          }}
        >
          Lưu
        </button>
        {saved && <span role="status">Đã lưu. Mục ẩn không còn trong bộ lọc, sản phẩm cũ giữ nguyên.</span>}
      </div>
    </div>
  );
}

/** Q6.4: show/hide and add; the last visible item of a group can not be hidden. */
export function TaxonomyConfig() {
  const state = useTaxonomy();
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  return (
    <div className="page">
      <PageHeader eyebrow="Cấu hình" title="Vỏ và nhân" />
      <TaxonomyEditor initial={state.data} />
    </div>
  );
}
