import type { DisbursementRequest, Payout, Reconciliation } from '../model/types';

/** Admin seed from the wireframe (q1-0 … q6-4). */
export const seedDisbursementRequests: DisbursementRequest[] = [
  { id: 'GN-31', orderId: 'MK-C071', vendor: 'Bánh Cổ Truyền Trăng Vàng', askedAt: '23/10/2026', milestone: 'đã duyệt maket, mua nguyên liệu', amount: 3000000, heldNow: 6000000, disbursedBefore: 0, state: 'waiting' },
];

export const seedPayouts: Payout[] = [
  { orderId: 'MK-8702', vendor: 'Xưởng Bánh Nghệ Nhân', complaintEnds: '15/10/2026', amount: 1285000, blocked: 'Chặn · lệch đối soát' },
  { orderId: 'MK-8711', vendor: 'Bánh Cổ Truyền Trăng Vàng', complaintEnds: '16/10/2026', amount: 460000 },
  { orderId: 'MK-8723', vendor: 'Đại lý Thu Hương', complaintEnds: '17/10/2026', amount: 385000 },
  { orderId: 'MK-8810', vendor: 'Bánh Cổ Truyền Trăng Vàng', complaintEnds: '22/10/2026', amount: 875000, blocked: 'Chặn · đang khiếu nại' },
];

export const seedReconciliation: Reconciliation = {
  month: '10/2026', vnpay: 187000000, held: 54200000, paidOut: 131200000, vendorFees: 1600000,
  rows: [
    { id: 'MK-8702', kind: 'Mua hàng có sẵn', vnpay: 1260000, system: 1285000 },
    { id: 'MK-8711', kind: 'Mua hàng có sẵn', vnpay: 460000, system: 460000 },
    { id: 'MK-C071', kind: 'Đặt cọc', vnpay: 6000000, system: 6000000 },
    { id: 'PMB-0008', kind: 'Phí mở bán', vnpay: 200000, system: 200000 },
  ],
};

