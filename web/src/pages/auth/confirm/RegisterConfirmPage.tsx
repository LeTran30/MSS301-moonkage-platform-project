import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Button, Input, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useSendVerifyOtp, useVerifyAccount } from '@/features/verify-account';
import { AuthShell, authShellStyles } from '@/widgets/auth-shell';
import pageStyles from './RegisterConfirmPage.module.css';

export function RegisterConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as { email?: string; phone?: string }) ?? {};
  const email = state.email ?? '';
  const [otp, setOtp] = useState('');
  const { busy, run } = useAction();
  const verifyAccount = useVerifyAccount();
  const sendVerifyOtp = useSendVerifyOtp();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (otp.length < 4) {
      toast.error('Vui lòng nhập đủ mã OTP!');
      return;
    }
    if (!email) {
      toast.error('Không tìm thấy email đăng ký. Vui lòng đăng ký lại.');
      return;
    }

    void run(async () => {
      // `POST /api/auth/verify-account` — `VerifyAccountRequest` (email + otp).
      await verifyAccount(email, otp);
      toast.success('Xác minh tài khoản thành công! Chào mừng bạn gia nhập Moonkage.');
      navigate(routes.auth.login);
    });
  }

  function handleResend() {
    void run(async () => {
      // `POST /api/auth/send-verify-account-otp`.
      await sendVerifyOtp(email);
      toast.info('Đã gửi lại mã OTP mới qua email!');
    });
  }

  return (
    <AuthShell
      icon="lock"
      title="Xác nhận tài khoản"
      subtitle={
        <>
          Mã OTP đã được gửi tới email <strong>{email || 'của bạn'}</strong>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={authShellStyles.form} noValidate>
        <div className={authShellStyles.formGroup}>
          <label className={authShellStyles.label} htmlFor="otp">
            Nhập mã OTP
          </label>
          <Input
            id="otp"
            type="text"
            maxLength={6}
            placeholder="888888"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            required
            className={pageStyles.otpInput}
          />
        </div>

        <Button type="submit" variant="primary" loading={busy} className={pageStyles.submitButton}>
          Kích Hoạt Tài Khoản
        </Button>

        <div className={pageStyles.actionRow}>
          <button type="button" onClick={handleResend} className={pageStyles.resendButton}>
            Gửi lại mã OTP
          </button>
          <Link to={routes.auth.login} className={pageStyles.changePhoneLink}>
            Đổi email đăng ký
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
