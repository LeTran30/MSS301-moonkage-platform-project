import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Button, Input, toast } from '@/shared/ui';
import { useAction, validators } from '@/shared/lib';
import { useSendResetOtp } from '@/features/reset-password';
import { AuthShell, authShellStyles } from '@/widgets/auth-shell';
import pageStyles from './ForgotPasswordPage.module.css';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const { busy, run } = useAction();
  const sendResetOtp = useSendResetOtp();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // AC-01.6: the reset OTP is sent to the e-mail address of the account.
    const error = validators.email(email);
    setEmailError(error ?? undefined);
    if (error) {
      toast.error(error);
      return;
    }

    void run(async () => {
      // `POST /api/auth/send-reset-password-otp` — `SendOtpRequest`.
      await sendResetOtp(email.trim());
      toast.success('Mã OTP đặt lại mật khẩu đã được gửi tới email của bạn!');
      navigate(routes.auth.resetPassword, { state: { email: email.trim() } });
    });
  }

  return (
    <AuthShell
      icon="🔑"
      title="Quên Mật Khẩu"
      subtitle="Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu."
    >
      <form onSubmit={handleSubmit} className={authShellStyles.form} noValidate>
        <div className={authShellStyles.formGroup}>
          <label className={authShellStyles.label} htmlFor="forgot-email">
            Email đã đăng ký *
          </label>
          <Input
            id="forgot-email"
            type="email"
            placeholder="ten@congty.com"
            value={email}
            error={emailError}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(undefined);
            }}
            required
          />
        </div>

        <Button type="submit" variant="primary" loading={busy} className={pageStyles.submitButton}>
          Gửi Yêu Cầu Khôi Phục
        </Button>

        <div className={pageStyles.backRow}>
          <Link to={routes.auth.login} className={pageStyles.backLink}>
            ← Quay lại Đăng Nhập
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
