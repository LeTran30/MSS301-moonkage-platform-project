import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from '../ProductCard';

type Product = Parameters<typeof ProductCard>[0]['product'];

const PRODUCT: Product = {
  id: 'product-1',
  name: 'Bánh nướng hạt sen',
  vendorId: 'vendor-1',
  vendorName: 'Tiệm bánh Trăng',
  brand: 'Tiệm bánh Trăng',
  price: 175000,
  stock: 20,
  images: [],
  description: 'Bánh nướng nhân hạt sen.',
  expiryDate: '15/11/2026',
  deliveryTag: 'Giao toàn quốc',
  province: 'Thành phố Hồ Chí Minh',
  rating: 0,
  reviewCount: 0,
  crusts: ['nuong'],
  fillings: ['hat-sen'],
  status: 'ACTIVE',
  soldCount: 0,
};

describe('Entities - ProductCard', () => {
  it('hiện hạn sử dụng ngay trên thẻ sản phẩm', () => {
    render(
      <MemoryRouter>
        <ProductCard product={PRODUCT} />
      </MemoryRouter>,
    );

    expect(screen.getByText('HSD:')).toBeInTheDocument();
    expect(screen.getByText('15/11/2026')).toBeInTheDocument();
  });

  it('không hiện dòng hạn sử dụng khi API chưa trả ngày', () => {
    render(
      <MemoryRouter>
        <ProductCard product={{ ...PRODUCT, expiryDate: '' }} />
      </MemoryRouter>,
    );

    expect(screen.queryByText('HSD:')).not.toBeInTheDocument();
  });
});
