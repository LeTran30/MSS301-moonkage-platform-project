import { useState, type ReactNode } from 'react';
import { FileDrop, KeyValue, PageHeader, Steps } from '../../../shared/ui';

const STEPS = ['Loại hình', 'Đơn vị', 'Chủ hộ', 'Giấy tờ', 'Nguồn hàng, cách bán', 'Xem lại'];

/**
 * M7.1: the seller profile in six steps; the owner comes from the verified CCCD (`owner`). Submitting is
 * simulated until the seller endpoints exist; `onSubmitted` moves to the seller channel (profile waiting).
 */
export function SellerApplyForm({ owner, onSubmitted }: { owner: { name: string; idMasked: string }; onSubmitted: () => void }) {
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState('Hộ kinh doanh');
  const [unit, setUnit] = useState({ name: '', address: '', regNo: '', phone: '' });
  const [isOwner, setIsOwner] = useState(false);
  const [source, setSource] = useState('Tự sản xuất');
  const [ways, setWays] = useState(['Shop – hàng có sẵn', 'Nhận đặt hàng']);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const checks: (() => string | null)[] = [
    () => null,
    () => (!unit.name.trim() || !unit.address.trim() || !unit.regNo.trim() || !/^0\d{9}$/.test(unit.phone.replace(/\s/g, '')) ? 'Điền đủ tên, địa chỉ, mã số đăng ký và số điện thoại 10 số.' : null),
    () => (isOwner ? null : 'Chỉ chủ hộ / chủ doanh nghiệp ghi trên giấy đăng ký được khai hồ sơ.'),
    () => null,
    () => (ways.length ? null : 'Chọn ít nhất một cách bán.'),
    () => (agree ? null : 'Đánh dấu ô xác nhận để nộp hồ sơ.'),
  ];

  const next = () => {
    const problem = checks[step]();
    setError(problem);
    if (problem) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else {
      setBusy(true);
      setTimeout(onSubmitted, 400);
    }
  };

  const input = (key: keyof typeof unit, label: string, type = 'text') => (
    <div className="mk-field">
      <label htmlFor={`u-${key}`}>{label}</label>
      <input id={`u-${key}`} type={type} value={unit[key]} onChange={(e) => setUnit({ ...unit, [key]: e.target.value })} />
    </div>
  );
  const edit = (to: number) => (
    <button type="button" className="mk-btn mk-btn--text" onClick={() => setStep(to)}>
      Sửa
    </button>
  );
  const withEdit = (value: ReactNode, to: number) => (
    <span className="row-between">
      {value} {edit(to)}
    </span>
  );

  return (
    <div className="page">
      <PageHeader title="Khai hồ sơ người bán" lead="Bản nháp tự lưu sau mỗi bước." />
      <Steps label="Các bước khai hồ sơ" steps={STEPS} current={step} />
      <div className="form-layout">
        <div className="form">
          <fieldset className="form-section">
            <legend>
              Bước {step + 1} · {STEPS[step]}
            </legend>
            {step === 0 && (
              <>
                {[
                  ['Hộ kinh doanh', 'Có giấy đăng ký hộ kinh doanh'],
                  ['Doanh nghiệp tư nhân', 'Có giấy đăng ký DNTN'],
                ].map(([k, hint]) => (
                  <label key={k} className="choice">
                    <input type="radio" name="kind" checked={kind === k} onChange={() => setKind(k)} />
                    <span>
                      <strong>{k}</strong>
                      <br />
                      <span className="muted">{hint}</span>
                    </span>
                  </label>
                ))}
                <p className="muted">Công ty TNHH, cổ phần: liên hệ đội vận hành Moonkage.</p>
              </>
            )}
            {step === 1 && (
              <>
                {input('name', 'Tên hiển thị trên Moonkage')}
                {input('address', 'Địa chỉ cơ sở')}
                <div className="field-row">
                  {input('regNo', 'Mã số đăng ký')}
                  {input('phone', 'Điện thoại', 'tel')}
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <p className="muted">Lấy từ CCCD đã xác minh</p>
                <KeyValue
                  rows={[
                    { label: 'Họ tên', value: owner.name },
                    { label: 'Số định danh', value: owner.idMasked },
                  ]}
                />
                <label className="check">
                  <input type="checkbox" checked={isOwner} onChange={(e) => setIsOwner(e.target.checked)} /> Tôi là chủ hộ / chủ doanh nghiệp ghi trên giấy đăng ký
                </label>
              </>
            )}
            {step === 3 && (
              <>
                <FileDrop label="Giấy đăng ký kinh doanh" hint="PDF, ảnh · tối đa 10MB" accept=".pdf,image/*" />
                <FileDrop label="Giấy an toàn thực phẩm" hint="Cần khi bạn tự sản xuất (bước 5)" accept=".pdf,image/*" />
              </>
            )}
            {step === 4 && (
              <>
                <span className="check-group__label">Nguồn hàng</span>
                {['Tự sản xuất', 'Bán lại hàng của đơn vị khác'].map((s) => (
                  <label key={s} className="check">
                    <input type="radio" name="source" checked={source === s} onChange={() => setSource(s)} /> {s}
                  </label>
                ))}
                <span className="check-group__label">Cách bán</span>
                {['Shop – hàng có sẵn', 'Nhận đặt hàng'].map((w) => (
                  <label key={w} className="check">
                    <input type="checkbox" checked={ways.includes(w)} onChange={() => setWays(ways.includes(w) ? ways.filter((x) => x !== w) : [...ways, w])} /> {w}
                  </label>
                ))}
              </>
            )}
            {step === 5 && (
              <>
                <KeyValue
                  rows={[
                    { label: 'Loại hình', value: withEdit(kind, 0) },
                    { label: 'Đơn vị', value: withEdit(unit.name || '—', 1) },
                    { label: 'Chủ hộ', value: owner.name },
                    { label: 'Giấy tờ', value: withEdit('Đã đính kèm', 3) },
                    { label: 'Cách bán', value: withEdit(ways.map((w) => w.split(' –')[0]).join(', '), 4) },
                  ]}
                />
                <label className="check">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> Thông tin trên là đúng. Tôi hiểu phí mở bán 200.000đ đóng
                  sau khi hồ sơ được duyệt.
                </label>
              </>
            )}
          </fieldset>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            {step > 0 && (
              <button type="button" className="mk-btn mk-btn--quiet" onClick={() => setStep(step - 1)}>
                ‹ Quay lại
              </button>
            )}
            <button type="button" className="mk-btn mk-btn--primary" onClick={next} aria-busy={busy || undefined}>
              {step === STEPS.length - 1 ? 'Nộp hồ sơ' : 'Tiếp tục'}
            </button>
          </div>
        </div>
        <aside className="side-note">
          <h2 className="card-title-text">Sau khi nộp</h2>
          <p className="muted">Moonkage đối chiếu giấy tờ với CCCD, thường trong 1–2 ngày làm việc. Bạn theo dõi ở Kênh người bán.</p>
        </aside>
      </div>
    </div>
  );
}
