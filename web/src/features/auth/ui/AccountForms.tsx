import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { strings } from '../../../shared/config/strings';

/**
 * The account forms around login (M5.2–M5.5). identity-service exposes only login so far: these forms check their
 * input and move to the next step; wire them to the endpoints when they exist.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function AuthCard({ title, lead, children, footer }: { title: string; lead?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="panel login__form">
      <p className="brand-text">{strings.appName}</p>
      <h1 className="title-text auth-title">{title}</h1>
      {lead && <p className="muted">{lead}</p>}
      {children}
      {footer && <div className="auth-footer">{footer}</div>}
    </div>
  );
}

function Field({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  autoComplete?: string;
}) {
  return (
    <div className={`mk-field${error ? ' mk-field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-hint` : undefined}
      />
      {(error || hint) && (
        <span className="mk-hint" id={`${id}-hint`}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
}

/** M5.2 */
export function RegisterForm({ onRegistered }: { onRegistered: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!EMAIL.test(email)) next.email = 'Nhập email đúng dạng, ví dụ ban@congty.vn.';
    if (password.length < MIN_PASSWORD) next.password = `Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự.`;
    if (again !== password) next.again = 'Hai mật khẩu chưa khớp.';
    setErrors(next);
    if (!Object.keys(next).length) onRegistered(email);
  };
  return (
    <AuthCard
      title="Đăng ký"
      lead="Tạo tài khoản để lưu giỏ hàng, địa chỉ và theo dõi đơn."
      footer={
        <>
          Đã có tài khoản? <Link to={routes.login}>Đăng nhập</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={submit} noValidate>
        <Field id="reg-email" label="Email" type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="email" />
        <Field
          id="reg-pass"
          label="Mật khẩu"
          type="password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          hint={`Ít nhất ${MIN_PASSWORD} ký tự`}
          autoComplete="new-password"
        />
        <Field id="reg-again" label="Nhập lại mật khẩu" type="password" value={again} onChange={setAgain} error={errors.again} autoComplete="new-password" />
        <button type="submit" className="mk-btn mk-btn--primary">
          Tạo tài khoản
        </button>
      </form>
    </AuthCard>
  );
}

/** M5.3: six boxes, typing moves to the next one. */
export function ConfirmAccountForm({ email, onConfirmed }: { email: string; onConfirmed: () => void }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const set = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const next = digits.map((x, j) => (j === i ? d : x));
    setDigits(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (digits.some((d) => !d)) return setError('Nhập đủ 6 số trong email.');
    onConfirmed();
  };
  return (
    <AuthCard title="Xác nhận tài khoản" lead={`Nhập mã 6 số vừa gửi tới ${email || 'email của bạn'}.`}>
      <form className="auth-form" onSubmit={submit} noValidate>
        <fieldset className="otp">
          <legend className="mk-sr">Mã xác nhận</legend>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className="otp__box mk-num"
              inputMode="numeric"
              maxLength={1}
              value={d}
              aria-label={`Số thứ ${i + 1}`}
              aria-invalid={error ? true : undefined}
              onChange={(e) => set(i, e.target.value)}
            />
          ))}
        </fieldset>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="mk-btn mk-btn--primary">
          Xác nhận
        </button>
        <p className="muted">
          Chưa nhận được?{' '}
          <button type="button" className="mk-btn mk-btn--text" onClick={() => setResent(true)}>
            Gửi lại mã
          </button>{' '}
          · <Link to={routes.register}>Đổi email</Link>
        </p>
        {resent && (
          <p className="muted" role="status">
            Đã gửi mã mới.
          </p>
        )}
      </form>
    </AuthCard>
  );
}

/** M5.4 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL.test(email)) return setError('Nhập email đã đăng ký.');
    setError(undefined);
    setSent(true);
  };
  return (
    <AuthCard
      title="Quên mật khẩu"
      lead="Nhập email đã đăng ký, chúng tôi gửi liên kết đặt lại mật khẩu."
      footer={<Link to={routes.login}>‹ Quay lại đăng nhập</Link>}
    >
      {sent ? (
        <div className="stack">
          <p role="status">Đã gửi liên kết tới {email}. Liên kết dùng được trong 30 phút.</p>
          <Link to={routes.resetPassword} className="mk-btn mk-btn--quiet">
            Mở liên kết (bản demo)
          </Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit} noValidate>
          <Field id="fp-email" label="Email" type="email" value={email} onChange={setEmail} error={error} autoComplete="email" />
          <button type="submit" className="mk-btn mk-btn--primary">
            Gửi liên kết
          </button>
        </form>
      )}
    </AuthCard>
  );
}

/** M5.5 */
export function ResetPasswordForm({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (password.length < MIN_PASSWORD) next.password = `Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự.`;
    if (again !== password) next.again = 'Hai mật khẩu chưa khớp.';
    setErrors(next);
    if (!Object.keys(next).length) onDone();
  };
  return (
    <AuthCard title="Đặt lại mật khẩu">
      <form className="auth-form" onSubmit={submit} noValidate>
        <Field id="rp-pass" label="Mật khẩu mới" type="password" value={password} onChange={setPassword} error={errors.password} hint={`Ít nhất ${MIN_PASSWORD} ký tự`} />
        <Field id="rp-again" label="Nhập lại mật khẩu mới" type="password" value={again} onChange={setAgain} error={errors.again} />
        <button type="submit" className="mk-btn mk-btn--primary">
          Lưu và đăng nhập
        </button>
      </form>
    </AuthCard>
  );
}
