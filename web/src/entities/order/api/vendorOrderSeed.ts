import type { VendorOrder } from '../model/vendorOrderTypes';

/** Orders of Xưởng Bánh Nghệ Nhân, the open demo shop. */
export const seedVendorOrders: VendorOrder[] = [
  {
    kind: 'ready', id: 'MK-9930', placedAt: '24/10/2026', buyer: 'Anh Tuấn', deliverTo: 'Cầu Giấy, Hà Nội', interProvince: false,
    lines: [{ name: 'Hộp Hoàng Kim 4 bánh', price: 680000, quantity: 2 }], shippingFee: 25000, status: 'new', invoiceAttached: false,
    history: [{ label: 'Người mua thanh toán', at: '24/10/2026 09:12' }],
  },
  {
    kind: 'ready', id: 'MK-9921', placedAt: '23/10/2026', buyer: 'Anh Minh', deliverTo: 'Ba Đình, Hà Nội', interProvince: false,
    lines: [{ name: 'Hộp Hoàng Kim 4 bánh', price: 680000, quantity: 1 }], shippingFee: 25000, status: 'shipping', tracking: 'VNPOST-881292', invoiceAttached: true,
    history: [
      { label: 'Bạn giao cho đơn vị vận chuyển', at: '23/10/2026 16:30' },
      { label: 'Bạn xác nhận đơn', at: '23/10/2026 14:45' },
      { label: 'Người mua thanh toán', at: '23/10/2026 14:15' },
    ],
  },
  {
    kind: 'ready', id: 'MK-8810', placedAt: '18/10/2026', buyer: 'Chị Lan', deliverTo: 'Quận 1, TP Hồ Chí Minh', interProvince: true,
    lines: [{ name: 'Hộp Trăng Rằm 4 bánh', price: 420000, quantity: 2 }], shippingFee: 35000, status: 'delivered', tracking: 'VNPOST-77120',
    deliveredAt: '19/10/2026', invoiceAttached: false,
    history: [
      { label: 'Người mua báo vấn đề', at: '20/10/2026' },
      { label: 'Đã giao · VNPOST-77120', at: '19/10/2026' },
      { label: 'Bạn xác nhận đơn', at: '18/10/2026' },
    ],
    complaint: { reason: 'Hộp hoặc bánh bị hỏng khi nhận', description: 'Nắp hộp rách, 1 bánh dập góc.', daysLeft: 1 },
  },
  {
    kind: 'custom', id: 'MK-C088', buyer: 'Công ty TNHH Mặt Trời', title: '150 hộp gỗ khắc logo', deliverBy: '10/11/2026', value: 18000000, depositPercent: 50,
    step: 'mockup', feedback: { text: 'Dời logo xuống giữa nắp.', at: '22/10/2026' }, mockupsSent: 2, held: 9000000, disbursed: 0, invoiceAttached: false,
    progress: [
      { label: 'Nhận cọc 9.000.000đ', at: '20/10/2026' },
      { label: 'Gửi maket lần 1, 2', at: '21–22/10/2026' },
    ],
  },
];
