import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminVouchersPage } from '../AdminVouchersPage';

/**
 * Q6.3 — Voucher hệ thống là tính năng **hoãn** (FR-13, FR-50).
 *
 * Màn hình phải tồn tại (IA không được thiếu mã trang) và phải nói thẳng là
 * đang hoãn, thay vì giả vờ có chức năng.
 */
function renderPage() {
  return render(
    <MemoryRouter>
      <AdminVouchersPage />
    </MemoryRouter>
  );
}

describe('AdminVouchersPage — màn hình hoãn', () => {
  it('có tiêu đề nêu rõ mã trang Q6.3', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Q6\.3/);
  });

  it('gắn nhãn "Hoãn trong bản demo"', () => {
    renderPage();
    expect(screen.getByText(/Hoãn trong bản demo/i)).toBeInTheDocument();
  });

  it('giải thích vì sao chưa có chức năng (FR-13, FR-50)', () => {
    renderPage();
    expect(screen.getByText(/FR-13/)).toBeInTheDocument();
    expect(screen.getByText(/FR-50/)).toBeInTheDocument();
  });

  it('không render bảng dữ liệu voucher (chưa có API)', () => {
    renderPage();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
