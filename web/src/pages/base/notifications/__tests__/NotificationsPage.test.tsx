import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationsPage } from '../NotificationsPage';

/**
 * M6.6 — Trung tâm thông báo dùng **chung** cho người mua và chủ người bán.
 *
 * IA ghi rõ "Người mua, Chủ người bán" ở một mã trang, và backend chỉ có một
 * endpoint theo tài khoản (`X-Account-Id`). Vì vậy giao diện chỉ đổi tiêu đề
 * và mô tả theo vai trò, không tách thành hai màn hình.
 */
const currentUser: { role: 'BUYER' | 'VENDOR'; [key: string]: unknown } = {
  id: 'usr_test',
  name: 'Nguyễn Văn A',
  phone: '0912345678',
  role: 'BUYER',
  nfcStatus: 'VERIFIED',
};

vi.mock('@/entities/user', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/user')>();
  return { ...actual, useCurrentUser: () => currentUser };
});

vi.mock('@/entities/notification', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/notification')>();
  return {
    ...actual,
    useNotifications: () => [],
    useNotificationInbox: () => undefined,
    notificationApi: { markAllRead: vi.fn(), markRead: vi.fn() },
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <NotificationsPage />
    </MemoryRouter>
  );
}

describe('NotificationsPage — M6.6 dùng chung hai vai trò', () => {
  it('người mua thấy tiêu đề trung tâm thông báo', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Trung tâm thông báo/i);
  });

  it('chủ người bán thấy tiêu đề thông báo cửa hàng', () => {
    currentUser.role = 'VENDOR';
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Thông báo cửa hàng/i);
    currentUser.role = 'BUYER';
  });

  it('luôn nêu mã màn hình M6.6', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/M6\.6/);
  });

  it('hiện trạng thái rỗng khi không có thông báo', () => {
    renderPage();
    expect(screen.getByText(/Không có thông báo nào/i)).toBeInTheDocument();
  });
});
