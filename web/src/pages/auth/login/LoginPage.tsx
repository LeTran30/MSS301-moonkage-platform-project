import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Button, Input } from '@/shared/ui';
import { validators, useAction } from '@/shared/lib';
import { useLogin } from '@/features/login';
import { AuthShell, authShellStyles } from '@/widgets/auth-shell';
import { returnPathAfterLogin } from './returnPathAfterLogin';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // Backend `LoginRequest.username` nhận email **hoặc** số điện thoại
  // (M5.4 của đặc tả nội dung), nên nhãn cũng phải nói đúng điều đó.
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
  }>({});

  const { busy, run, error } = useAction();
  const login = useLogin();

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const identifierErr = validators.loginIdentifier(identifier);
      const passErr = validators.password(password);

      if (identifierErr || passErr) {
        setErrors({
          identifier: identifierErr ?? undefined,
          password: passErr ?? undefined,
        });
        return;
      }
      setErrors({});
      await login(identifier.trim(), password);
      navigate(returnPathAfterLogin(location.state), { replace: true });
    });
  };

  return (
    <AuthShell
      icon="cake"
      title="Đăng nhập Moonkage"
      subtitle="Sàn thương mại điện tử chuyên về bánh trung thu"
    >
      <form onSubmit={handleLogin} className={authShellStyles.form} noValidate>
        <div className={authShellStyles.formGroup}>
          <label htmlFor="login-identifier" className={authShellStyles.label}>
            Email hoặc số điện thoại
          </label>
          <Input
            id="login-identifier"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: undefined }));
            }}
            placeholder="0912 345 678 hoặc ten@mien.vn"
            aria-invalid={Boolean(errors.identifier)}
            aria-describedby={errors.identifier ? 'login-identifier-err' : undefined}
          />
          {errors.identifier && (
            <span id="login-identifier-err" className={authShellStyles.errorText} role="alert">
              {errors.identifier}
            </span>
          )}
        </div>

        <div className={authShellStyles.formGroup}>
          <div className={authShellStyles.passHeader}>
            <label htmlFor="login-pass" className={authShellStyles.label}>
              Mật khẩu
            </label>
            <Link to={routes.auth.forgotPassword} className={authShellStyles.forgotPass}>
              Quên mật khẩu?
            </Link>
          </div>
          <Input
            id="login-pass"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'login-pass-err' : undefined}
          />
          {errors.password && (
            <span id="login-pass-err" className={authShellStyles.errorText} role="alert">
              {errors.password}
            </span>
          )}
        </div>

        <Button type="submit" variant="primary" size="lg" loading={busy}>
          Đăng nhập
        </Button>

        {error && (
          <div className={authShellStyles.errorText} role="alert">
            {error}
          </div>
        )}

        <p className={authShellStyles.switchAuth}>
          Chưa có tài khoản? <Link to={routes.auth.register}>Đăng ký ngay</Link>
        </p>
      </form>
    </AuthShell>
  );
}
