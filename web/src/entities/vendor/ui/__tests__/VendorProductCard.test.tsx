import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { VendorProductCard } from '../VendorProductCard';

type VendorProduct = Parameters<typeof VendorProductCard>[0]['product'];

const PRODUCT: VendorProduct = {
  id: 'p-1',
  name: 'Bánh nướng hạt sen trứng muối',
  listPrice: 175000,
  stock: 35,
  expiryDate: '2026-11-15',
  crustCodes: ['banh-nuong'],
  fillingCodes: ['hat-sen'],
  status: 'ON_SALE',
};

const NAMES: Record<string, string> = { 'banh-nuong': 'Bánh nướng', 'hat-sen': 'Hạt sen' };

function renderCard(product: VendorProduct) {
  const onToggleVisibility = vi.fn();
  const onEdit = vi.fn();
  render(
    <VendorProductCard
      product={product}
      busy={false}
      onToggleVisibility={onToggleVisibility}
      onEdit={onEdit}
      attributeName={(code) => NAMES[code] ?? code}
    />,
  );
  return { onToggleVisibility, onEdit };
}

describe('Entities - VendorProductCard (B4.0, FR-34, FR-46)', () => {
  it('đang mở bán: tên vỏ/nhân, tồn kho theo hộp, ẩn và sửa được', () => {
    const { onToggleVisibility, onEdit } = renderCard(PRODUCT);

    expect(screen.getByText('Đang mở bán')).toBeTruthy();
    expect(screen.getByText('Bánh nướng')).toBeTruthy();
    expect(screen.getByText('35 hộp')).toBeTruthy();
    expect(screen.getByText('15/11/2026')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Ẩn sản phẩm' }));
    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa' }));
    expect(onToggleVisibility).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('đang ẩn: cho bật hiển thị lại', () => {
    renderCard({ ...PRODUCT, status: 'HIDDEN' });

    expect(screen.getByText('Đang ẩn')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Bật hiển thị' })).toBeTruthy();
  });

  it('bị sàn gỡ: hiện lý do, không còn nút bật/ẩn hay sửa', () => {
    renderCard({ ...PRODUCT, status: 'REMOVED', removedReason: 'Ảnh không đúng sản phẩm' });

    expect(screen.getByText('Bị sàn gỡ')).toBeTruthy();
    expect(screen.getByText('Lý do gỡ: Ảnh không đúng sản phẩm')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
