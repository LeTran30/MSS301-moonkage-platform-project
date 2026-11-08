import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VendorCapacityPage } from '../VendorCapacityPage';

/**
 * B6.4 — Lịch công suất là tính năng **hoãn** (FR-37).
 *
 * Màn hình phải tồn tại (IA không được thiếu mã trang) và nói thẳng là đang
 * hoãn, đồng thời vẫn hiện được công suất tuần mà hồ sơ nhận đặt hàng đã có.
 */
vi.mock('@/entities/vendor', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/vendor')>();
  return {
    ...actual,
    useMyVendorId: () => ({
      kind: 'loaded',
      data: 'ven_quan',
      reload: vi.fn(),
    }),
    useOrderProfile: () => ({
      kind: 'loaded',
      data: { weeklyCapacity: 300 },
      reload: vi.fn(),
    }),
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <VendorCapacityPage />
    </MemoryRouter>,
  );
}

describe('VendorCapacityPage — màn hình hoãn', () => {
  it('không để lộ mã trang trong giao diện', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveTextContent(/B6\.4/);
  });

  it('gắn nhãn "Chưa có trong phiên bản này"', () => {
    renderPage();
    expect(screen.getByText(/Chưa có trong phiên bản này/i)).toBeInTheDocument();
  });

  it('vẫn hiện công suất tuần lấy từ hồ sơ nhận đặt hàng', () => {
    renderPage();
    expect(screen.getByText(/300 hộp \/ tuần/)).toBeInTheDocument();
  });

  it('hướng người dùng sang nơi khai báo điều kiện nhận đặt hàng', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /Điều Kiện Nhận Đặt Hàng/i })).toBeInTheDocument();
  });
});
