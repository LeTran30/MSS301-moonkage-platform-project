import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Button, Input, toast } from '@/shared/ui';
import { useAction, validators } from '@/shared/lib';
import { useRegister } from '@/features/register';
import { AuthShell, authShellStyles } from '@/widgets/auth-shell';
import pageStyles from './RegisterPage.module.css';

type FieldErrors = {
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
};

export function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<'BUYER' | 'VENDOR'>('BUYER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const { busy, run } = useAction();
  const register = useRegister();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // AC-01.1: the e-mail is mandatory, the phone number is optional.
    // Lỗi hiện ngay tại ô nhập (không chỉ toast) để người dùng biết chính xác
    // trường nào sai, và trình đọc màn hình đọc được thông báo.
    const emailError = validators.email(email);
    const phoneError = phone.trim() ? validators.phoneVN(phone) : null;
    const passwordError = validators.password(password);
    const confirmError = password !== confirmPassword ? 'Mật khẩu nhập lại không khớp!' : null;

    const nextErrors: FieldErrors = {
      email: emailError ?? undefined,
      phone: phoneError ?? undefined,
      password: passwordError ?? undefined,
      confirmPassword: confirmError ?? undefined,
    };
    setErrors(nextErrors);

    if (emailError || phoneError || passwordError || confirmError) {
      toast.error('Vui lòng kiểm tra lại các trường được đánh dấu.');
      return;
    }

    void run(async () => {
      // `POST /api/auth/register` — `RegisterAccountRequest`.
      const result = await register({
        email: email.trim(),
        phoneNumber: phone.trim(),
        fullName: name.trim(),
        password,
      });
      toast.success(
        result.otpSent
          ? 'Mã OTP xác thực đã được gửi tới email của bạn!'
          : 'Tài khoản đã được tạo. Vui lòng kiểm tra email để xác thực.',
      );
      navigate(routes.auth.registerConfirm, {
        state: { email: result.email || email.trim(), phone, name, role },
      });
    });
  }

  return (
    <AuthShell
      icon="cake"
      title="Tạo Tài Khoản Moonkage"
      subtitle="Đón Tết Đoàn Viên — Mua lẻ tinh tế, Đặt sỉ tối ưu"
    >
      <div className={pageStyles.roleSwitch} role="group" aria-label="Loại tài khoản">
        <button
          type="button"
          onClick={() => setRole('BUYER')}
          className={`${pageStyles.roleButton} ${role === 'BUYER' ? pageStyles.roleButtonActive : ''}`}
          aria-pressed={role === 'BUYER'}
        >
          Khách Mua & Doanh Nghiệp
        </button>
        <button
          type="button"
          onClick={() => setRole('VENDOR')}
          className={`${pageStyles.roleButton} ${role === 'VENDOR' ? pageStyles.roleButtonActive : ''}`}
          aria-pressed={role === 'VENDOR'}
        >
          Nghệ Nhân & Xưởng Bánh
        </button>
      </div>

      <form onSubmit={handleSubmit} className={authShellStyles.form} noValidate>
        <div className={authShellStyles.formGroup}>
          <label className={authShellStyles.label} htmlFor="register-name">
            Họ và tên / Tên đơn vị đại diện *
          </label>
          <Input
            id="register-name"
            type="text"
            placeholder="Ví dụ: Nguyễn Văn An"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className={authShellStyles.formGroup}>
          <label className={authShellStyles.label} htmlFor="register-email">
            Địa chỉ Email *
          </label>
          <Input
            id="register-email"
            type="email"
            placeholder="ten@doanhnghiep.vn"
            value={email}
            error={errors.email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            required
          />
        </div>

        <div className={authShellStyles.formGroup}>
          <label className={authShellStyles.label} htmlFor="register-phone">
            Số điện thoại (không bắt buộc)
          </label>
          <Input
            id="register-phone"
            type="tel"
            placeholder="0912 345 678"
            value={phone}
            error={errors.phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
            }}
          />
        </div>

        <div className={authShellStyles.formGroup}>
          <label className={authShellStyles.label} htmlFor="register-password">
            Mật khẩu bảo vệ *
          </label>
          <Input
            id="register-password"
            type="password"
            placeholder="Tối thiểu 8 ký tự"
            value={password}
            error={errors.password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            required
          />
        </div>

        <div className={authShellStyles.formGroup}>
          <label className={authShellStyles.label} htmlFor="register-confirm">
            Xác nhận lại mật khẩu *
          </label>
          <Input
            id="register-confirm"
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            error={errors.confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            required
          />
        </div>

        <Button type="submit" variant="primary" loading={busy} className={pageStyles.submitButton}>
          Đăng Ký Tài Khoản
        </Button>
      </form>

      <div className={pageStyles.footer}>
        Đã có tài khoản?{' '}
        <Link to={routes.auth.login} className={pageStyles.footerLink}>
          Đăng nhập ngay
        </Link>
      </div>
    </AuthShell>
  );
}
