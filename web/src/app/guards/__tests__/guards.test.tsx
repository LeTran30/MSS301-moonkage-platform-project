import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { RequireAuth } from '../RequireAuth';
import { RequireAdmin } from '../RequireAdmin';
import { GUEST_USER, markAnonymous, markAuthenticated, markRestoring, userStore, type User } from '@/entities/user';
import { clearTokens, storeTokens } from '@/shared/api/tokenVault';

const BUYER: User = {
  id: 'acc_buyer',
  name: 'Nguyễn Minh',
  email: 'buyer@example.vn',
  phone: '0912345678',
  role: 'BUYER',
  nfcStatus: 'UNVERIFIED',
};

const ADMIN: User = {
  ...BUYER,
  id: 'acc_admin',
  name: 'Quản trị',
  role: 'ADMIN',
};

/**
 * Bảng route trong test: trang đăng nhập phải là một route riêng, nếu không
 * `Navigate` sẽ quay lại chính guard và tạo vòng lặp vô hạn.
 */
function renderWithRouter(ui: ReactNode, initialPath = '/tai-khoan') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/dang-nhap" element={<a href="/dang-nhap">Về trang đăng nhập</a>} />
        <Route path="*" element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}

/** Nội dung bảo vệ: chỉ hiện khi guard cho qua. */
function Protected() {
  return <div>NOI_DUNG_BAO_VE</div>;
}

describe('RequireAuth — hồi quy phiên làm việc', () => {
  beforeEach(() => {
    clearTokens();
    userStore.set(GUEST_USER);
    markAnonymous();
  });

  it('đưa khách (không token) tới trang đăng nhập', async () => {
    renderWithRouter(
      <RequireAuth>
        <Protected />
      </RequireAuth>,
      '/tai-khoan',
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /đăng nhập/i })).toBeInTheDocument();
    });
    expect(screen.queryByText('NOI_DUNG_BAO_VE')).not.toBeInTheDocument();
  });

  it('chờ (không đá ra) khi còn token nhưng hồ sơ chưa nạp xong', () => {
    // Đúng khoảnh khắc đầu tiên sau khi F5: vault còn token, `userStore`
    // rỗng, `SessionBridge` chưa kịp báo `RESTORING`.
    storeTokens('token-hop-le');
    userStore.set(GUEST_USER);
    markAnonymous();

    renderWithRouter(
      <RequireAuth>
        <Protected />
      </RequireAuth>,
    );

    // Không được đá ra trang đăng nhập, cũng không được hiện nội dung.
    expect(screen.queryByRole('link', { name: /đăng nhập/i })).not.toBeInTheDocument();
    expect(screen.queryByText('NOI_DUNG_BAO_VE')).not.toBeInTheDocument();
  });

  it('chờ khi SessionBridge đang khôi phục phiên', () => {
    storeTokens('token-hop-le');
    markRestoring();

    renderWithRouter(
      <RequireAuth>
        <Protected />
      </RequireAuth>,
    );

    expect(screen.queryByRole('link', { name: /đăng nhập/i })).not.toBeInTheDocument();
  });

  it('cho qua khi phiên đã xác nhận', () => {
    storeTokens('token-hop-le');
    userStore.set(BUYER);
    markAuthenticated();

    renderWithRouter(
      <RequireAuth>
        <Protected />
      </RequireAuth>,
    );

    expect(screen.getByText('NOI_DUNG_BAO_VE')).toBeInTheDocument();
  });
});

describe('RequireAdmin — hồi quy phiên làm việc', () => {
  beforeEach(() => {
    clearTokens();
    userStore.set(GUEST_USER);
    markAnonymous();
  });

  it('chờ thay vì báo 403 khi phiên chưa khôi phục xong', () => {
    storeTokens('token-hop-le');
    markRestoring();

    renderWithRouter(
      <RequireAdmin>
        <Protected />
      </RequireAdmin>,
    );

    expect(screen.queryByText(/Từ chối quyền truy cập/)).not.toBeInTheDocument();
    expect(screen.queryByText('NOI_DUNG_BAO_VE')).not.toBeInTheDocument();
  });

  it('báo 403 khi phiên đã xác nhận nhưng không phải quản trị viên', async () => {
    storeTokens('token-hop-le');
    userStore.set(BUYER);
    markAuthenticated();

    renderWithRouter(
      <RequireAdmin>
        <Protected />
      </RequireAdmin>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Từ chối quyền truy cập/)).toBeInTheDocument();
    });
  });

  it('cho qua khi là quản trị viên', () => {
    storeTokens('token-hop-le');
    userStore.set(ADMIN);
    markAuthenticated();

    renderWithRouter(
      <RequireAdmin>
        <Protected />
      </RequireAdmin>,
    );

    expect(screen.getByText('NOI_DUNG_BAO_VE')).toBeInTheDocument();
  });
});
