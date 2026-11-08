import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { routes } from '@/shared/config';
import type { User } from '@/entities/user';
import { HeaderTopBar } from '../HeaderTopBar';

const BUYER: User = {
  id: 'u-1',
  name: 'Người mua',
  email: 'buyer@example.test',
  phone: '0900000000',
  role: 'BUYER',
  nfcStatus: 'UNVERIFIED',
};

function renderTopBar(props: Parameters<typeof HeaderTopBar>[0]) {
  return render(
    <MemoryRouter>
      <HeaderTopBar {...props} />
    </MemoryRouter>,
  );
}

describe('Widgets - HeaderTopBar', () => {
  it('mời người chưa có Shop đăng ký bán hàng', () => {
    renderTopBar({ user: BUYER, zone: 'shop' });

    expect(screen.getByRole('link', { name: /Đăng ký bán hàng/ })).toHaveAttribute(
      'href',
      routes.base.sellIntro,
    );
  });

  it('dẫn chủ Shop vào Kênh người bán', () => {
    renderTopBar({ user: { ...BUYER, vendorId: 'v-1' }, zone: 'shop' });

    expect(screen.getByRole('link', { name: /Kênh người bán của Shop bạn/ })).toHaveAttribute(
      'href',
      routes.vendor.overview,
    );
  });

  it('không đoán lối vào khi phiên còn đang khôi phục', () => {
    renderTopBar({ user: BUYER, zone: 'shop', restoring: true });

    expect(screen.queryByRole('link', { name: /Đăng ký bán hàng|Kênh người bán/ })).not.toBeInTheDocument();
  });

  it('ở Kênh người bán chỉ có lối về kênh mua sắm', () => {
    renderTopBar({ user: { ...BUYER, vendorId: 'v-1' }, zone: 'vendor' });

    expect(screen.getByRole('link', { name: /Về kênh mua sắm/ })).toHaveAttribute('href', routes.base.home);
    expect(screen.queryByRole('link', { name: /Kênh người bán của Shop bạn/ })).not.toBeInTheDocument();
  });
});
