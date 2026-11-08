import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Button, Input, toast } from '@/shared/ui';
import { useAction, validators } from '@/shared/lib';
import { useResetPassword } from '@/features/reset-password';
import { AuthShell, authShellStyles } from '@/widgets/auth-shell';
import pageStyles from './ResetPasswordPage.module.css';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email ?? '';
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    otp?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const { busy, run } = useAction();
  const resetPassword = useResetPassword();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error('Không tìm thấy email đã đăng ký. Vui lòng yêu cầu mã OTP lại.');
      return;
    }
    const otpError = otp.trim() ? null : 'Vui lòng nhập mã OTP đã nhận qua email.';
    const passwordError = validators.password(newPassword);
    const confirmError = newPassword !== confirmPassword ? 'Mật khẩu nhập lại không khớp!' : null;

    setErrors({
      otp: otpError ?? undefined,
      password: passwordError ?? undefined,
      confirmPassword: confirmError ?? undefined,
    });
    if (otpError || passwordError || confirmError) {
      toast.error('Vui lòng kiểm tra lại các trường được đánh dấu.');
      return;
    }

    void run(async () => {
      // `POST /api/auth/reset-password` — `ResetPasswordRequest` (email, otp, newPassword).
      await resetPassword(email, otp.trim(), newPassword);
      toast.success('Mật khẩu của bạn đã được cập nhật thành công!');
      navigate(routes.auth.login);
    });
  }

  return (
    <AuthShell
      icon="shield"
      title="Đặt Lại Mật Khẩu"
      subtitle={
        <>
          Nhập mã OTP đã nhận qua email <strong>{email || 'của bạn'}</strong> cùng mật khẩu mới.
        </>
      }
    >
      <form onSubmit={handleSubmit} className={authShellStyles.form} noValidate>
        <div className={authShellStyles.formGroup}>
          <label className={authShellStyles.label} htmlFor="reset-otp">
            Mã OTP đặt lại mật khẩu
          </label>
          <Input
            id="reset-otp"
            type="text"
            placeholder="Nhập mã 6 số"
            value={otp}
            error={errors.otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, ''));
              if (errors.otp) setErrors((prev) => ({ ...prev, otp: undefined }));
            }}
            required
          />
        </div>

        <div className={authShellStyles.formGroup}>
          <label className={authShellStyles.label} htmlFor="reset-password">
            Mật khẩu mới *
          </label>
          <Input
            id="reset-password"
            type="password"
            placeholder="Tối thiểu 8 ký tự"
            value={newPassword}
            error={errors.password}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            required
          />
        </div>

        <div className={authShellStyles.formGroup}>
          <label className={authShellStyles.label} htmlFor="reset-confirm">
            Xác nhận lại mật khẩu mới *
          </label>
          <Input
            id="reset-confirm"
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            error={errors.confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword)
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            required
          />
        </div>

        <Button type="submit" variant="primary" loading={busy} className={pageStyles.submitButton}>
          Cập Nhật Mật Khẩu
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
