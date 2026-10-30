import type { Disbursement, Settlement } from '../model/types';

/** Money of Xưởng Bánh Nghệ Nhân, the open demo shop. */
export const seedSettlements: Settlement[] = [
  { orderId: 'MK-9921', deliveredAt: '24/10/2026', goods: 680000, shipping: 25000, state: 'Chờ hết hạn khiếu nại' },
  { orderId: 'MK-8810', deliveredAt: '19/10/2026', goods: 840000, shipping: 35000, state: 'Tạm dừng · khiếu nại' },
  { orderId: 'MK-8702', deliveredAt: '12/10/2026', goods: 1260000, shipping: 25000, state: 'Đã chuyển 16/10/2026' },
];

export const seedDisbursements: Disbursement[] = [
  { orderId: 'MK-C071', milestone: 'Đã duyệt maket, mua nguyên liệu', amount: 3000000, heldAfter: 3000000, state: 'Đã giải ngân 21/10/2026' },
  { orderId: 'MK-C088', milestone: 'Chưa duyệt maket', amount: null, heldAfter: 9000000, state: 'Chưa xin được' },
];
