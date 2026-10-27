import type { IncomingRequest } from '../model/incomingRequest';

/** Quote requests that reached Xưởng Bánh Nghệ Nhân, the open demo shop. */
export const seedIncoming: IncomingRequest[] = [
  {
    id: 'YC-104', boxes: 150, perBox: '4 bánh', summary: 'In logo · nướng · thập cẩm, hạt sen', invitation: 'open', buyer: 'Công ty TNHH Mặt Trời', buyerVerified: true,
    deliverTo: 'Cầu Giấy, Hà Nội', deliverBy: '15/11/2026', hoursLeft: 18, note: 'Cần xuất hóa đơn công ty', files: ['Logo_MatTroi.pdf'], state: 'new',
  },
  {
    id: 'YC-098', boxes: 120, perBox: 'Hộp gỗ 4 bánh', summary: 'Khắc logo · nướng · hạt sen', invitation: 'direct', buyer: 'Anh Quân', buyerVerified: true,
    deliverTo: 'Hoàn Kiếm, Hà Nội', deliverBy: '20/11/2026', hoursLeft: 48, files: [], state: 'new',
  },
  {
    id: 'YC-090', boxes: 60, perBox: '6 bánh', summary: 'Hộp giấy · dẻo · đậu xanh', invitation: 'open', buyer: 'Chị Hạnh', buyerVerified: true,
    deliverTo: 'Ba Đình, Hà Nội', deliverBy: '05/11/2026', hoursLeft: 0, files: [], state: 'quoted',
    quote: { unitPrice: 135000, depositPercent: 50, deliverBy: '02/11/2026', validUntil: '27/10/2026', note: 'Hộp giấy cứng in tên.' },
  },
];
