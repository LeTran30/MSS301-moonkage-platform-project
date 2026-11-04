import { describe, it, expect } from 'vitest';
import { mapNotificationPush, notificationsQueue } from '../useNotificationPush';

describe('Notification Entity - useNotificationPush (NFR-10, AC-10.2)', () => {
  it('đăng ký ký tự của orchestrator: /user/queue/notifications', () => {
    // WebSocketConfig: enableSimpleBroker("/queue") + userDestinationPrefix("/user")
    expect(notificationsQueue).toBe('/user/queue/notifications');
  });

  it('map giữ nguyên loại thông báo mà backend đẩy xuống', () => {
    const mapped = mapNotificationPush({
      id: 'n-1',
      type: 'ORDER',
      title: 'Đơn hàng mới',
      content: 'Bạn có một đơn mới.',
      targetUrl: '/tai-khoan/don-hang/MK-1',
      read: false,
      createdAt: '2026-11-01T00:00:00Z',
    });

    expect(mapped.id).toBe('n-1');
    expect(mapped.type).toBe('ORDER');
    expect(mapped.targetPath).toBe('/tai-khoan/don-hang/MK-1');
    expect(mapped.isRead).toBe(false);
  });

  it('loại lạ thành SYSTEM thay vì làm hỏng danh sách', () => {
    const mapped = mapNotificationPush({
      id: 'n-2',
      type: 'SOMETHING_NEW',
      title: 'Thông báo',
      content: 'Nội dung',
    });

    expect(mapped.type).toBe('SYSTEM');
    expect(mapped.targetPath).toBe('');
  });
});
