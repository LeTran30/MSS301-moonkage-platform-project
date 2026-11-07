import { describe, it, expect } from 'vitest';
import { routes } from '@/shared/config';
import { returnPathAfterLogin } from '../returnPathAfterLogin';

describe('returnPathAfterLogin', () => {
  it('quay lại trang người dùng bị đưa đi, giữ cả query', () => {
    expect(returnPathAfterLogin({ from: { pathname: '/san-pham/p-1', search: '?a=1' } })).toBe(
      '/san-pham/p-1?a=1',
    );
  });

  it('không có trang cũ thì về tổng quan tài khoản', () => {
    expect(returnPathAfterLogin(null)).toBe(routes.account.overview);
  });

  it('bỏ qua đường dẫn ra ngoài ứng dụng và chính trang đăng nhập', () => {
    expect(returnPathAfterLogin({ from: { pathname: '//evil.example' } })).toBe(
      routes.account.overview,
    );
    expect(returnPathAfterLogin({ from: { pathname: routes.auth.login } })).toBe(
      routes.account.overview,
    );
  });
});
