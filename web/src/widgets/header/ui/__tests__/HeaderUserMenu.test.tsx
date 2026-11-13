import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { GUEST_USER, type User } from '@/entities/user';
import { routes } from '@/shared/config';
import { HeaderUserMenu } from '../HeaderUserMenu';

const BUYER: User = {
  id: 'buyer-1',
  name: 'Người mua',
  email: 'buyer@example.test',
  phone: '0900000000',
  role: 'BUYER',
  nfcStatus: 'UNVERIFIED',
};

function renderMenu(user: User, restoring = false) {
  return render(
    <MemoryRouter>
      <HeaderUserMenu user={user} restoring={restoring} />
    </MemoryRouter>,
  );
}

describe('Widgets - HeaderUserMenu', () => {
  it('hiện đăng nhập và đăng ký cho khách, không hiện đăng xuất', () => {
    renderMenu(GUEST_USER);

    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute(
      'href',
      routes.auth.login,
    );
    expect(screen.getByRole('link', { name: 'Đăng ký' })).toHaveAttribute(
      'href',
      routes.auth.register,
    );
    expect(screen.queryByRole('button', { name: /Đăng xuất/ })).not.toBeInTheDocument();
  });

  it('chỉ hiện trạng thái tải trong lúc khôi phục phiên', () => {
    renderMenu(GUEST_USER, true);

    expect(screen.getByLabelText('Đang khôi phục phiên đăng nhập')).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.queryByRole('link', { name: 'Đăng nhập' })).not.toBeInTheDocument();
    expect(screen.queryByText('Đăng xuất')).not.toBeInTheDocument();
  });

  it('vẫn hiện đăng xuất cho tài khoản đã đăng nhập', async () => {
    const user = userEvent.setup();
    renderMenu(BUYER);

    await user.click(screen.getByRole('button', { name: /Người mua/ }));

    expect(screen.getByRole('menuitem', { name: /Đăng xuất/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Đăng nhập' })).not.toBeInTheDocument();
  });
});
