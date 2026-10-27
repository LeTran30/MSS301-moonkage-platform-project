import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { config } from '../../../shared/config/env';
import { routes } from '../../../shared/config/routes';
import { strings } from '../../../shared/config/strings';
import { Button } from '../../../shared/ui';
import {
  confirmPasswordReset,
  registerAccount,
  requestPasswordResetOtp,
  resendVerifyAccountOtp,
  verifyAccountOtp,
} from '../model/useAuthActions';
import styles from './AccountForms.module.css';

/**
 * The account forms around login (M5.2–M5.5), wired to identity-service (`/api/auth/*`) and demo mode.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function AuthCard({ title, lead, children, footer }: { title: string; lead?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className={styles.card}>
      <p className="brand-text">{strings.appName}</p>
      <h1 className={styles.title}>{title}</h1>
      {lead && <p className="muted">{lead}</p>}
      {children}
      {footer && <div className={styles.footer}>{footer}</div>}
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
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = 'Nhập họ tên hiển thị.';
    if (!EMAIL.test(email.trim())) next.email = 'Nhập email đúng dạng, ví dụ ban@congty.vn.';
    if (password.length < MIN_PASSWORD) next.password = `Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự.`;
    if (again !== password) next.again = 'Hai mật khẩu chưa khớp.';
    setErrors(next);
    setServerError(null);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await registerAccount({ fullName: fullName.trim(), email: email.trim(), password });
      onRegistered(email.trim());
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldErrs: Record<string, string> = {};
        if (err.fieldError('fullName')) fieldErrs.fullName = err.fieldError('fullName')!;
        if (err.fieldError('email')) fieldErrs.email = err.fieldError('email')!;
        if (err.fieldError('password')) fieldErrs.password = err.fieldError('password')!;
        if (Object.keys(fieldErrs).length) setErrors(fieldErrs);
        else setServerError(err.message);
      } else {
        setServerError(strings.errors.server);
      }
    } finally {
      setSubmitting(false);
    }
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
      <form className={styles.form} onSubmit={submit} noValidate>
        <Field id="reg-name" label="Họ tên" value={fullName} onChange={setFullName} error={errors.fullName} autoComplete="name" />
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
        {serverError && (
          <p className="error-text" role="alert">
            {serverError}
          </p>
        )}
        <Button type="submit" variant="primary" disabled={submitting} busy={submitting}>
          {submitting ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
        </Button>
      </form>
    </AuthCard>
  );
}

/** M5.3: six boxes, typing moves to the next one. */
export function ConfirmAccountForm({ email, onConfirmed }: { email: string; onConfirmed: () => void }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const set = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const next = digits.map((x, j) => (j === i ? d : x));
    setDigits(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (digits.some((d) => !d)) return setError('Nhập đủ 6 số trong email.');
    setError(null);
    setSubmitting(true);
    try {
      await verifyAccountOtp(email, digits.join(''));
      onConfirmed();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : strings.errors.server);
    } finally {
      setSubmitting(false);
    }
  };
  const handleResend = async () => {
    setError(null);
    setResent(false);
    try {
      if (email) await resendVerifyAccountOtp(email);
      setResent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : strings.errors.server);
    }
  };
  return (
    <AuthCard title="Xác nhận tài khoản" lead={`Nhập mã 6 số vừa gửi tới ${email || 'email của bạn'}.`}>
      <form className={styles.form} onSubmit={submit} noValidate>
        <fieldset className={styles.otp}>
          <legend className="mk-sr">Mã xác nhận</legend>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className={`${styles.otpBox} mk-num`}
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
        <Button type="submit" variant="primary" disabled={submitting} busy={submitting}>
          {submitting ? 'Đang xác nhận…' : 'Xác nhận'}
        </Button>
        <p className="muted">
          Chưa nhận được?{' '}
          <Button variant="text" onClick={() => void handleResend()}>
            Gửi lại mã
          </Button>{' '}
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
  const [submitting, setSubmitting] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) return setError('Nhập email đã đăng ký.');
    setError(undefined);
    setSubmitting(true);
    try {
      await requestPasswordResetOtp(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : strings.errors.server);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <AuthCard
      title="Quên mật khẩu"
      lead="Nhập email đã đăng ký, chúng tôi gửi mã đặt lại mật khẩu."
      footer={<Link to={routes.login}>‹ Quay lại đăng nhập</Link>}
    >
      {sent ? (
        <div className="stack">
          <p role="status">Đã gửi mã xác nhận đặt lại mật khẩu tới {email.trim()}.</p>
          <Link to={routes.resetPassword} state={{ email: email.trim() }} className="mk-btn mk-btn--primary">
            Nhập mã và đặt lại mật khẩu
          </Link>
        </div>
      ) : (
        <form className={styles.form} onSubmit={submit} noValidate>
          <Field id="fp-email" label="Email" type="email" value={email} onChange={setEmail} error={error} autoComplete="email" />
          <Button type="submit" variant="primary" disabled={submitting} busy={submitting}>
            {submitting ? 'Đang gửi…' : 'Gửi mã xác nhận'}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

/** M5.5 */
export function ResetPasswordForm({ initialEmail = '', onDone }: { initialEmail?: string; onDone: () => void }) {
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(config.demoMode ? '123456' : '');
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!config.demoMode && !EMAIL.test(email.trim())) next.email = 'Nhập email đã đăng ký.';
    if (otp.replace(/\D/g, '').length !== 6) next.otp = 'Nhập mã xác nhận 6 chữ số trong email.';
    if (password.length < MIN_PASSWORD) next.password = `Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự.`;
    if (again !== password) next.again = 'Hai mật khẩu chưa khớp.';
    setErrors(next);
    setServerError(null);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await confirmPasswordReset(email.trim() || 'demo@moonkage.vn', otp.replace(/\D/g, ''), password);
      onDone();
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError(strings.errors.server);
      }
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <AuthCard title="Đặt lại mật khẩu">
      <form className={styles.form} onSubmit={submit} noValidate>
        {(!initialEmail || !config.demoMode) && (
          <Field id="rp-email" label="Email" type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="email" />
        )}
        <Field id="rp-otp" label="Mã xác nhận (6 chữ số)" value={otp} onChange={setOtp} error={errors.otp} autoComplete="one-time-code" />
        <Field id="rp-pass" label="Mật khẩu mới" type="password" value={password} onChange={setPassword} error={errors.password} hint={`Ít nhất ${MIN_PASSWORD} ký tự`} autoComplete="new-password" />
        <Field id="rp-again" label="Nhập lại mật khẩu mới" type="password" value={again} onChange={setAgain} error={errors.again} autoComplete="new-password" />
        {serverError && (
          <p className="error-text" role="alert">
            {serverError}
          </p>
        )}
        <Button type="submit" variant="primary" disabled={submitting} busy={submitting}>
          {submitting ? 'Đang lưu…' : 'Lưu và đăng nhập'}
        </Button>
      </form>
    </AuthCard>
  );
}
