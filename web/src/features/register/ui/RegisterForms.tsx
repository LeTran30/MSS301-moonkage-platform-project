import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AccountCard, AccountField, EMAIL_PATTERN, MIN_PASSWORD_LENGTH, userStrings } from '@/entities/user';
import { ApiError } from '@/shared/api/client';
import { routes } from '@/shared/config/routes';
import { Button } from '@/shared/ui';
import { registerAccount, resendVerifyAccountOtp, verifyAccountOtp } from '../api/registerApi';
import styles from './RegisterForms.module.css';

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
    if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Nhập email đúng dạng, ví dụ ban@congty.vn.';
    if (password.length < MIN_PASSWORD_LENGTH) next.password = `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
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
        setServerError(userStrings.serverError);
      }
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <AccountCard
      title="Đăng ký"
      lead="Tạo tài khoản để lưu giỏ hàng, địa chỉ và theo dõi đơn."
      footer={
        <>
          Đã có tài khoản? <Link to={routes.auth.login}>Đăng nhập</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={submit} noValidate>
        <AccountField id="reg-name" label="Họ tên" value={fullName} onChange={setFullName} error={errors.fullName} autoComplete="name" />
        <AccountField id="reg-email" label="Email" type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="email" />
        <AccountField
          id="reg-pass"
          label="Mật khẩu"
          type="password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          hint={`Ít nhất ${MIN_PASSWORD_LENGTH} ký tự`}
          autoComplete="new-password"
        />
        <AccountField id="reg-again" label="Nhập lại mật khẩu" type="password" value={again} onChange={setAgain} error={errors.again} autoComplete="new-password" />
        {serverError && (
          <p className="error-text" role="alert">
            {serverError}
          </p>
        )}
        <Button type="submit" variant="primary" disabled={submitting} busy={submitting}>
          {submitting ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
        </Button>
      </form>
    </AccountCard>
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
      setError(err instanceof ApiError ? err.message : userStrings.serverError);
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
      setError(err instanceof ApiError ? err.message : userStrings.serverError);
    }
  };
  return (
    <AccountCard title="Xác nhận tài khoản" lead={`Nhập mã 6 số vừa gửi tới ${email || 'email của bạn'}.`}>
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
          · <Link to={routes.auth.register}>Đổi email</Link>
        </p>
        {resent && (
          <p className="muted" role="status">
            Đã gửi mã mới.
          </p>
        )}
      </form>
    </AccountCard>
  );
}

/** M5.4 */
