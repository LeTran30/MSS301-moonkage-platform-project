import { useState, type FormEvent, type ReactNode } from 'react';
import type { QuoteRequest } from '@/entities/quote';
import { FileDrop, PageHeader } from '@/shared/ui';
import { createRequest } from '../api/requestQuoteApi';
import styles from './QuoteRequestForm.module.css';

const CRUSTS = ['Nướng', 'Dẻo', 'Than tre'];
const FILLINGS = ['Thập cẩm', 'Hạt sen', 'Đậu xanh', 'Trà xanh'];
const CUSTOM_KINDS = ['In logo lên hộp', 'Hộp, thiệp thiết kế riêng', 'Không làm riêng'];

export interface DirectTarget {
  id: string;
  name: string;
  shortName: string;
  minBoxes: number;
  boxOptions: string[];
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/**
 * M3.1 (sent to every matching vendor) and M3.4 (sent to one vendor, `direct`). `side` is the page's right
 * column (match count, or the chosen vendor); `onBoxesChange` lets it follow the form.
 */
export function QuoteRequestForm({
  direct,
  deliverOptions,
  onSubmitted,
  onCancel,
  onChange,
  side,
  blocked,
}: {
  direct?: DirectTarget;
  deliverOptions: string[];
  onSubmitted: (request: QuoteRequest) => void;
  onCancel: () => void;
  onChange?: (boxes: number, wantsLogo: boolean) => void;
  side: ReactNode;
  /** Message that stops sending (no vendor matches). */
  blocked?: string | null;
}) {
  const [boxes, setBoxes] = useState(direct ? Math.max(direct.minBoxes, 120) : 150);
  const [perBox, setPerBox] = useState(direct ? direct.boxOptions[0] : '4 bánh');
  const [crusts, setCrusts] = useState(['Nướng']);
  const [fillings, setFillings] = useState(['Thập cẩm', 'Hạt sen']);
  const [customKind, setCustomKind] = useState(CUSTOM_KINDS[0]);
  const [customText, setCustomText] = useState(direct ? 'Khắc laser logo công ty lên nắp hộp gỗ' : '');
  const [deliverBy, setDeliverBy] = useState('2026-11-15');
  const [deliverTo, setDeliverTo] = useState(deliverOptions[0] ?? '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const tooFew = direct && boxes < direct.minBoxes ? `${direct.name} nhận từ ${direct.minBoxes} hộp.` : null;
  const setBoxesAndTell = (n: number) => {
    setBoxes(n);
    onChange?.(n, customKind === CUSTOM_KINDS[0]);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (tooFew || blocked) return;
    setBusy(true);
    const request = await createRequest({
      kind: direct ? 'direct' : 'open',
      directTo: direct?.name,
      boxes,
      perBox,
      crusts,
      fillings,
      custom: direct ? customText : customKind,
      deliverTo,
      deliverBy: deliverBy.split('-').reverse().join('/'),
      note: note || undefined,
      invited: direct ? [{ vendorId: direct.id, vendorName: direct.name }] : [],
    });
    onSubmitted(request);
  };

  return (
    <div className="page">
      <PageHeader
        title={direct ? `Gửi yêu cầu cho ${direct.name}` : 'Tạo yêu cầu báo giá'}
        lead={
          direct
            ? 'Đơn vị sẽ trả báo giá trong Yêu cầu và báo giá của bạn.'
            : 'Mô tả thứ bạn cần; các đơn vị phù hợp sẽ gửi báo giá để bạn so sánh.'
        }
      />
      <div className={styles.formLayout}>
        <form className={styles.form} onSubmit={submit} noValidate>
          <fieldset className={styles.formSection}>
            <legend>1. Bánh và hộp</legend>
            <div className={styles.fieldRow}>
              <div className={`mk-field${tooFew || blocked ? ' mk-field--error' : ''}`}>
                <label htmlFor="boxes">Số hộp</label>
                <input
                  id="boxes"
                  className="mk-num"
                  type="number"
                  min={1}
                  value={boxes}
                  onChange={(e) => setBoxesAndTell(Math.max(1, Number(e.target.value) || 1))}
                  aria-invalid={tooFew || blocked ? true : undefined}
                  aria-describedby="boxes-hint"
                />
                <span className="mk-hint" id="boxes-hint">
                  {tooFew ?? blocked ?? (direct ? `Đơn vị này nhận từ ${direct.minBoxes} hộp` : 'Mỗi đơn vị có số hộp tối thiểu riêng')}
                </span>
              </div>
              <div className="mk-field">
                <label htmlFor="per-box">{direct ? 'Kiểu hộp' : 'Số bánh mỗi hộp'}</label>
                <select id="per-box" value={perBox} onChange={(e) => setPerBox(e.target.value)}>
                  {(direct ? direct.boxOptions : ['4 bánh', '6 bánh', '2 bánh', 'Khác']).map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            {!direct && (
              <div className={styles.checkGroup}>
                <span className={styles.checkGroupLabel}>Vỏ bánh</span>
                {CRUSTS.map((c) => (
                  <label key={c} className="check">
                    <input type="checkbox" checked={crusts.includes(c)} onChange={() => setCrusts(toggle(crusts, c))} /> {c}
                  </label>
                ))}
              </div>
            )}
            <div className={styles.checkGroup}>
              <span className={styles.checkGroupLabel}>Nhân bánh</span>
              {FILLINGS.map((f) => (
                <label key={f} className="check">
                  <input type="checkbox" checked={fillings.includes(f)} onChange={() => setFillings(toggle(fillings, f))} /> {f}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.formSection}>
            <legend>2. Làm riêng</legend>
            {direct ? (
              <div className="mk-field">
                <label htmlFor="custom">Mô tả phần làm riêng</label>
                <input id="custom" value={customText} onChange={(e) => setCustomText(e.target.value)} />
              </div>
            ) : (
              <>
                {CUSTOM_KINDS.map((k) => (
                  <label key={k} className="check">
                    <input
                      type="radio"
                      name="custom"
                      checked={customKind === k}
                      onChange={() => {
                        setCustomKind(k);
                        onChange?.(boxes, k === CUSTOM_KINDS[0]);
                      }}
                    />{' '}
                    {k}
                  </label>
                ))}
                {customKind === CUSTOM_KINDS[0] && <p className="muted">In logo: đơn vị gửi maket để bạn duyệt trước khi làm.</p>}
              </>
            )}
            <FileDrop label="Đính kèm logo hoặc mẫu (không bắt buộc)" hint="PDF, AI, PNG · tối đa 20MB" accept=".pdf,.ai,.png,.jpg" />
          </fieldset>

          <fieldset className={styles.formSection}>
            <legend>3. Giao hàng</legend>
            <div className={styles.fieldRow}>
              <div className="mk-field">
                <label htmlFor="by">Cần nhận trước ngày</label>
                <input id="by" type="date" value={deliverBy} onChange={(e) => setDeliverBy(e.target.value)} />
              </div>
              <div className="mk-field">
                <label htmlFor="to">{direct ? 'Địa chỉ nhận' : 'Giao tới'}</label>
                <select id="to" value={deliverTo} onChange={(e) => setDeliverTo(e.target.value)}>
                  {deliverOptions.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mk-field">
              <label htmlFor="note">{direct ? 'Ghi chú' : 'Ghi chú cho đơn vị'}</label>
              <textarea id="note" className={styles.textarea} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </fieldset>

          <div className={styles.formActions}>
            <button type="button" className="mk-btn mk-btn--quiet" onClick={onCancel}>
              Hủy
            </button>
            <button type="submit" className="mk-btn mk-btn--primary" disabled={Boolean(tooFew || blocked)} aria-busy={busy || undefined}>
              {direct ? `Gửi yêu cầu cho ${direct.shortName}` : 'Gửi yêu cầu báo giá'}
            </button>
          </div>
        </form>
        <aside className={styles.sideNote}>{side}</aside>
      </div>
    </div>
  );
}
