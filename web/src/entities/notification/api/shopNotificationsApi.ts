import { mockResponse } from '@/shared/api/mock';
import { routes } from '@/shared/config/routes';

/** A notification of the shop (B7.0), separate from the owner's buying notifications (M6.6). */
export interface ShopNotification {
  id: string;
  title: string;
  detail: string;
  source: string;
  when: string;
  unread: boolean;
  to: string;
}

/** Sample from the wireframe (b7-0); the notification endpoint does not exist yet. */
const mockShopNotifications: ShopNotification[] = [
  { id: 's1', title: 'Đơn mới MK-9930', detail: '2 hộp Hoàng Kim', source: 'Người mua Anh Tuấn', when: '3 giờ trước', unread: true, to: routes.vendor.order('MK-9930') },
  { id: 's2', title: 'Yêu cầu báo giá mới YC-104', detail: '150 hộp in logo', source: 'Hạn gửi báo giá còn 18 giờ', when: 'Hôm qua', unread: true, to: routes.vendor.request('YC-104') },
  { id: 's3', title: 'Người mua yêu cầu sửa maket', detail: 'Đơn MK-C088', source: 'Công ty TNHH Mặt Trời', when: '22/10/2026', unread: false, to: routes.vendor.order('MK-C088') },
  { id: 's4', title: 'Đợt giải ngân cọc đã chuyển', detail: 'Đơn MK-C071', source: 'Moonkage', when: '21/10/2026', unread: false, to: routes.vendor.disbursements },
];

export function fetchShopNotifications(): Promise<ShopNotification[]> {
  return mockResponse(mockShopNotifications);
}
