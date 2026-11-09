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
    </MemoryRouter>,
  );
}

describe('AdminVouchersPage — màn hình hoãn', () => {
  it('có tiêu đề nói rõ tính năng', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Voucher/i);
  });

  it('không để lộ mã trang trong giao diện', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveTextContent(/Q6\.3/);
  });

  it('gắn nhãn "Chưa có trong phiên bản này"', () => {
    renderPage();
    expect(screen.getByText(/Chưa có trong phiên bản này/i)).toBeInTheDocument();
  });

  it('giải thích rõ tình trạng tính năng mà không lộ mã đặc tả', () => {
    renderPage();
    expect(screen.getByText(/Tính năng đang được phát triển/i)).toBeInTheDocument();
    expect(screen.queryByText(/FR-13/)).not.toBeInTheDocument();
    expect(screen.queryByText(/FR-50/)).not.toBeInTheDocument();
    expect(screen.queryByText(/BR-32/)).not.toBeInTheDocument();
  });

  it('không nhắc tới đặc tả nghiệp vụ hay endpoint trong nội dung hiển thị', () => {
    renderPage();
    expect(screen.queryByText(/requirements\.md/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/VoucherController/)).not.toBeInTheDocument();
    expect(screen.queryByText(/GET\/POST \/api\/vouchers/)).not.toBeInTheDocument();
  });

  it('không render bảng dữ liệu voucher (chưa có API)', () => {
    renderPage();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
