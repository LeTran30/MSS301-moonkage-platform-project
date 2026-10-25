import type { Complaint, Order } from './types';

const HOME = { name: 'Anh Minh', phone: '0912 345 678', line: '18 Hoàng Diệu, Ba Đình, Hà Nội' };
const INVOICE = { company: 'Công ty TNHH Mặt Trời', taxCode: '0108992140', email: 'ke-toan@mattroi.vn' };

/** Buyer orders from the wireframe (m6-1, m6-1-1, m6-1-2, m6-1-3). */
export const seedOrders: Order[] = [
  {
    kind: 'ready', id: 'MK-9921', shop: 'Xưởng Bánh Nghệ Nhân', paymentId: 'PAY-99214', placedAt: '23/10/2026',
    lines: [{ name: 'Hộp Hoàng Kim 4 bánh', price: 680000, quantity: 1 }], shippingFee: 25000, status: 'shipping',
    tracking: 'VNPOST-881292', expectedAt: '24/10/2026', address: HOME, invoice: INVOICE, complaintDays: 3,
    history: [
      { label: 'Đang giao', at: '23/10/2026 16:30' },
      { label: 'Shop xác nhận và đóng gói', at: '23/10/2026 14:45' },
      { label: 'Thanh toán thành công', at: '23/10/2026 14:15' },
    ],
  },
  {
    kind: 'ready', id: 'MK-9922', shop: 'Bánh Cổ Truyền Trăng Vàng', paymentId: 'PAY-99214', placedAt: '23/10/2026',
    lines: [{ name: 'Hộp Trăng Rằm 4 bánh', price: 420000, quantity: 1 }], shippingFee: 20000, status: 'pending',
    address: HOME, invoice: INVOICE, complaintDays: 3,
    history: [{ label: 'Thanh toán thành công', at: '23/10/2026 14:15' }],
  },
  {
    kind: 'ready', id: 'MK-8810', shop: 'Bánh Cổ Truyền Trăng Vàng', paymentId: 'PAY-98810', placedAt: '18/10/2026',
    lines: [{ name: 'Hộp Trăng Rằm 4 bánh', price: 420000, quantity: 2 }], shippingFee: 20000, status: 'delivered',
    deliveredAt: '19/10/2026', address: HOME, complaintDays: 3, complaintId: 'KN-0412',
    history: [
      { label: 'Đã giao', at: '19/10/2026 10:20' },
      { label: 'Đang giao', at: '18/10/2026 17:00' },
      { label: 'Shop xác nhận và đóng gói', at: '18/10/2026 15:10' },
      { label: 'Thanh toán thành công', at: '18/10/2026 14:02' },
    ],
  },
  {
    kind: 'custom', id: 'MK-C088', supplier: 'Xưởng Bánh Nghệ Nhân', title: '150 hộp gỗ khắc logo', requestId: 'YC-104',
    value: 18000000, depositPercent: 50, depositPaidAt: '20/10/2026', step: 'mockup', invoiceAttached: false,
    mockups: [
      { version: 2, sentAt: '22/10/2026', note: 'Sửa theo góp ý: logo nhỏ lại', state: 'waiting' },
      { version: 1, sentAt: '21/10/2026', note: 'Bản đầu, logo giữa nắp', state: 'revise', feedback: 'Logo to quá, thu nhỏ 30%.' },
    ],
    progress: [
      { label: 'Đặt cọc 9.000.000đ', at: '20/10/2026' },
      { label: 'Đơn vị gửi maket lần 1', at: '21/10/2026' },
      { label: 'Bạn yêu cầu sửa maket', at: '21/10/2026' },
      { label: 'Đơn vị gửi maket lần 2', at: '22/10/2026' },
    ],
  },
  {
    kind: 'custom', id: 'MK-C071', supplier: 'Bánh Cổ Truyền Trăng Vàng', title: '80 hộp sơn mài', requestId: 'YC-090',
    value: 12000000, depositPercent: 50, depositPaidAt: '05/10/2026', step: 'remaining', deliveredAt: '22/10/2026', invoiceAttached: true,
    mockups: [{ version: 1, sentAt: '06/10/2026', note: 'Hộp sơn mài đỏ, chữ vàng', state: 'approved' }],
    progress: [
      { label: 'Đặt cọc 6.000.000đ', at: '05/10/2026' },
      { label: 'Bạn duyệt maket lần 1', at: '07/10/2026' },
      { label: 'Đơn vị sản xuất xong', at: '20/10/2026' },
      { label: 'Đã giao', at: '22/10/2026' },
    ],
  },
];

export const seedComplaints: Complaint[] = [
  {
    id: 'KN-0412', orderId: 'MK-8810', shop: 'Bánh Cổ Truyền Trăng Vàng', reason: 'Hộp hoặc bánh bị hỏng khi nhận',
    description: 'Nắp hộp rách, 1 bánh dập góc.', photos: 1, sentAt: '20/10/2026',
    events: [
      { label: 'Quản trị quyết định', at: '23/10/2026' },
      { label: 'Người bán đề xuất hoàn 1 bánh', at: '21/10/2026' },
      { label: 'Bạn gửi báo vấn đề', at: '20/10/2026' },
    ],
    decision: { title: 'Hoàn một phần', amount: 210000, body: 'Ảnh cho thấy 1 bánh hỏng. Hoàn giá 1 bánh, về tài khoản VNPay đã trả.', at: '23/10/2026' },
  },
];
