import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AccountCard, AccountField, EMAIL_PATTERN, MIN_PASSWORD_LENGTH, userStrings } from '@/entities/user';
import { ApiError } from '@/shared/api/client';
import { config } from '@/shared/config/env';
import { routes } from '@/shared/config/routes';
import { Button } from '@/shared/ui';
import { confirmPasswordReset, requestPasswordResetOtp } from '../api/resetPasswordApi';
import styles from './ResetPasswordForms.module.css';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) return setError('Nhập email đã đăng ký.');
    setError(undefined);
    setSubmitting(true);
    try {
      await requestPasswordResetOtp(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : userStrings.serverError);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <AccountCard
      title="Quên mật khẩu"
      lead="Nhập email đã đăng ký, chúng tôi gửi mã đặt lại mật khẩu."
      footer={<Link to={routes.auth.login}>‹ Quay lại đăng nhập</Link>}
    >
      {sent ? (
        <div className="stack">
          <p role="status">Đã gửi mã xác nhận đặt lại mật khẩu tới {email.trim()}.</p>
          <Link to={routes.auth.resetPassword} state={{ email: email.trim() }} className="mk-btn mk-btn--primary">
            Nhập mã và đặt lại mật khẩu
          </Link>
        </div>
      ) : (
        <form className={styles.form} onSubmit={submit} noValidate>
          <AccountField id="fp-email" label="Email" type="email" value={email} onChange={setEmail} error={error} autoComplete="email" />
          <Button type="submit" variant="primary" disabled={submitting} busy={submitting}>
            {submitting ? 'Đang gửi…' : 'Gửi mã xác nhận'}
          </Button>
        </form>
      )}
    </AccountCard>
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
    if (!config.demoMode && !EMAIL_PATTERN.test(email.trim())) next.email = 'Nhập email đã đăng ký.';
    if (otp.replace(/\D/g, '').length !== 6) next.otp = 'Nhập mã xác nhận 6 chữ số trong email.';
    if (password.length < MIN_PASSWORD_LENGTH) next.password = `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
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
        setServerError(userStrings.serverError);
      }
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <AccountCard title="Đặt lại mật khẩu">
      <form className={styles.form} onSubmit={submit} noValidate>
        {(!initialEmail || !config.demoMode) && (
          <AccountField id="rp-email" label="Email" type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="email" />
        )}
        <AccountField id="rp-otp" label="Mã xác nhận (6 chữ số)" value={otp} onChange={setOtp} error={errors.otp} autoComplete="one-time-code" />
        <AccountField id="rp-pass" label="Mật khẩu mới" type="password" value={password} onChange={setPassword} error={errors.password} hint={`Ít nhất ${MIN_PASSWORD_LENGTH} ký tự`} autoComplete="new-password" />
        <AccountField id="rp-again" label="Nhập lại mật khẩu mới" type="password" value={again} onChange={setAgain} error={errors.again} autoComplete="new-password" />
        {serverError && (
          <p className="error-text" role="alert">
            {serverError}
          </p>
        )}
        <Button type="submit" variant="primary" disabled={submitting} busy={submitting}>
          {submitting ? 'Đang lưu…' : 'Lưu và đăng nhập'}
        </Button>
      </form>
    </AccountCard>
  );
}
