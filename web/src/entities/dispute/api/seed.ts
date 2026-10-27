import type { Dispute } from '../model/types';

/** Admin seed from the wireframe (q1-0 … q6-4). */
export const seedDisputes: Dispute[] = [
  {
    id: 'KN-09', orderId: 'MK-8810', openedAt: '20/10/2026', buyer: 'Chị Lan', vendor: 'Bánh Cổ Truyền Trăng Vàng', reason: 'Hộp hoặc bánh bị hỏng khi nhận',
    buyerText: 'Nắp hộp rách, 1 bánh dập góc.', vendorProposal: { kind: 'Hoàn một phần', amount: 210000, note: 'Đồng ý 1 bánh bị dập do vận chuyển.' },
    lines: [
      { name: 'Hộp Trăng Rằm 4 bánh × 2', amount: 840000 },
      { name: 'Phí giao liên tỉnh · giao 19/10/2026 · VNPOST-77120', amount: 35000 },
    ],
    held: 875000, paidOut: 0, state: 'open',
    history: [
      { label: 'Người bán đề xuất', at: '21/10/2026' },
      { label: 'Người mua báo vấn đề · tiền bị giữ', at: '20/10/2026' },
    ],
  },
  {
    id: 'KN-07', orderId: 'MK-8655', openedAt: '12/10/2026', buyer: 'Anh Dũng', vendor: 'Đại lý Thu Hương', reason: 'Thiếu hoặc sai so với đơn',
    buyerText: 'Thiếu 1 hộp.', lines: [{ name: 'Hộp Thu Sắc 5 bánh mini × 2', amount: 720000 }], held: 0, paidOut: 360000, state: 'decided',
    decision: { kind: 'Hoàn một phần', amount: 360000, note: 'Người bán xác nhận giao thiếu 1 hộp.', at: '14/10/2026' },
    history: [{ label: 'Quản trị quyết định', at: '14/10/2026' }],
  },
];

