import { mockResponse } from '../../../shared/api/mock';

/** A notification of the buying account (M6.6). Shop notifications live in the seller channel (B7.0), not here. */
export interface BuyerNotification {
  id: string;
  title: string;
  detail: string;
  source: string;
  when: string;
  unread: boolean;
  /** In-app path the notification opens. */
  to: string;
}

/** Sample from the wireframe (m6-6); the notification endpoint does not exist yet. */
const mockNotifications: BuyerNotification[] = [
  { id: 'n1', title: 'Maket lần 2 đã có', detail: 'Đơn MK-C088', source: 'Xưởng Bánh Nghệ Nhân', when: '2 giờ trước', unread: true, to: '/tai-khoan/don-hang/MK-C088' },
  { id: 'n2', title: '2 báo giá mới', detail: 'Yêu cầu YC-104', source: 'Moonkage', when: 'Hôm qua', unread: true, to: '/tai-khoan/yeu-cau/YC-104' },
  { id: 'n3', title: 'Khiếu nại đơn MK-8810 đã có quyết định', detail: '', source: 'Moonkage', when: '23/10/2026', unread: false, to: '/tai-khoan/don-hang/MK-8810' },
];

export function fetchNotifications(): Promise<BuyerNotification[]> {
  return mockResponse(mockNotifications);
}
