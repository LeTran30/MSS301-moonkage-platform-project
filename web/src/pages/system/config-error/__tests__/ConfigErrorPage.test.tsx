import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfigErrorPage } from '../ConfigErrorPage';

/**
 * Màn hình lỗi cấu hình.
 *
 * Khi thiếu `VITE_API_BASE_URL` mà không bật demo mode, toàn bộ app sẽ hỏng
 * với lỗi mạng khó hiểu. Trang này phải nói rõ cần tạo file nào, điền khoá
 * nào.
 */
describe('ConfigErrorPage', () => {
  it('nêu rõ thiếu cấu hình API Gateway', () => {
    render(<ConfigErrorPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Thiếu cấu hình API Gateway/i);
  });

  it('chỉ ra tên file cần tạo', () => {
    render(<ConfigErrorPage />);
    expect(screen.getAllByText(/web\/\.env\.local/).length).toBeGreaterThan(0);
  });

  it('nêu tên biến môi trường cần điền', () => {
    render(<ConfigErrorPage />);
    expect(screen.getAllByText(/VITE_API_BASE_URL/).length).toBeGreaterThan(0);
  });

  it('có nút tải lại trang', () => {
    render(<ConfigErrorPage />);
    expect(screen.getByRole('button', { name: /Tải lại trang/i })).toBeInTheDocument();
  });
});
