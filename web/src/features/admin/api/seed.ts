import type { AdminProduct, DisbursementRequest, Dispute, Payout, ProvinceFee, Reconciliation, SellerApplication, Taxonomy } from './types';

/** Admin seed from the wireframe (q1-0 … q6-4). */
export const seedApplications: SellerApplication[] = [
  {
    id: 'thao-moc', account: 'chohoso@moonkage.vn', shopName: 'Tiệm Bánh Thảo Mộc', kind: 'Hộ kinh doanh', city: 'Hà Nội', ways: 'Shop',
    attempt: 1, submittedAt: '23/10/2026', waiting: 'chờ 1 ngày', regNo: '01K9002231', address: '8 Ngõ Huế, Hai Bà Trưng, Hà Nội', source: 'Tự sản xuất',
    ownerOnPaper: { name: 'Phạm Thu Thảo', id: '001290004712' }, ownerOnChip: { name: 'PHẠM THU THẢO', id: '001290004712' }, state: 'pending',
    history: [
      { label: 'Hệ thống so khớp chủ hộ: khớp', at: '23/10/2026 15:00' },
      { label: 'Người bán nộp hồ sơ lần 1', at: '23/10/2026 14:30' },
    ],
  },
  {
    id: 'nghe-nhan', account: 'chushop@moonkage.vn', shopName: 'Xưởng Bánh Nghệ Nhân', kind: 'Hộ kinh doanh', city: 'Hà Nội', ways: 'Shop + nhận đặt hàng',
    attempt: 1, submittedAt: '22/10/2026', waiting: 'duyệt 24/10/2026', regNo: '01J8001928', address: '12 Phan Kế Bính, Ba Đình, Hà Nội', source: 'Tự sản xuất',
    ownerOnPaper: { name: 'Vũ Thị Mai Hoa', id: '001188009922' }, ownerOnChip: { name: 'VŨ THỊ MAI HOA', id: '001188009922' }, state: 'approved',
    history: [
      { label: 'Quản trị duyệt hồ sơ', at: '24/10/2026 09:10' },
      { label: 'Người bán nộp hồ sơ lần 1', at: '22/10/2026 10:05' },
    ],
  },
  {
    id: 'minh-tam', account: '', shopName: 'Xưởng bánh Minh Tâm', kind: 'Doanh nghiệp tư nhân', city: 'TP Hồ Chí Minh', ways: 'Nhận đặt hàng',
    attempt: 2, submittedAt: '21/10/2026', waiting: 'gửi lại 21/10/2026', regNo: '0316002871', address: '45 Lý Thường Kiệt, Quận 10, TP Hồ Chí Minh', source: 'Tự sản xuất',
    ownerOnPaper: { name: 'Lê Minh Tâm', id: '079085001234' }, ownerOnChip: { name: 'LÊ MINH TÂM', id: '079085001243' }, state: 'needs-more',
    history: [
      { label: 'Quản trị yêu cầu bổ sung: số định danh trên giấy khác chip', at: '20/10/2026' },
      { label: 'Người bán nộp hồ sơ lần 1', at: '18/10/2026' },
    ],
  },
];

export const seedAdminProducts: AdminProduct[] = [
  { id: 'hop-hoang-kim-4-banh', name: 'Hộp Hoàng Kim 4 bánh', shop: 'Xưởng Bánh Nghệ Nhân', price: 680000 },
  { id: 'hop-hoang-kim-dac-biet', name: 'Hộp Hoàng Kim Đặc Biệt', shop: 'Xưởng Bánh Nghệ Nhân', price: 720000 },
  { id: 'hop-trang-ram-4-banh', name: 'Hộp Trăng Rằm 4 bánh', shop: 'Bánh Cổ Truyền Trăng Vàng', price: 420000 },
  { id: 'banh-deo-hat-sen-150g', name: 'Bánh dẻo hạt sen 150g', shop: 'Bánh Cổ Truyền Trăng Vàng', price: 65000 },
  { id: 'hop-thu-vang-4-banh', name: 'Hộp Thu Vàng 4 bánh', shop: 'Xưởng Bánh Nghệ Nhân', price: 450000, removed: { reason: 'Ảnh không đúng sản phẩm', at: '20/10/2026' } },
];

export const seedDisbursementRequests: DisbursementRequest[] = [
  { id: 'GN-31', orderId: 'MK-C071', seller: 'Bánh Cổ Truyền Trăng Vàng', askedAt: '23/10/2026', milestone: 'đã duyệt maket, mua nguyên liệu', amount: 3000000, heldNow: 6000000, disbursedBefore: 0, state: 'waiting' },
];

export const seedPayouts: Payout[] = [
  { orderId: 'MK-8702', seller: 'Xưởng Bánh Nghệ Nhân', complaintEnds: '15/10/2026', amount: 1285000, blocked: 'Chặn · lệch đối soát' },
  { orderId: 'MK-8711', seller: 'Bánh Cổ Truyền Trăng Vàng', complaintEnds: '16/10/2026', amount: 460000 },
  { orderId: 'MK-8723', seller: 'Đại lý Thu Hương', complaintEnds: '17/10/2026', amount: 385000 },
  { orderId: 'MK-8810', seller: 'Bánh Cổ Truyền Trăng Vàng', complaintEnds: '22/10/2026', amount: 875000, blocked: 'Chặn · đang khiếu nại' },
];

export const seedReconciliation: Reconciliation = {
  month: '10/2026', vnpay: 187000000, held: 54200000, paidOut: 131200000, sellerFees: 1600000,
  rows: [
    { id: 'MK-8702', kind: 'Mua hàng có sẵn', vnpay: 1260000, system: 1285000 },
    { id: 'MK-8711', kind: 'Mua hàng có sẵn', vnpay: 460000, system: 460000 },
    { id: 'MK-C071', kind: 'Đặt cọc', vnpay: 6000000, system: 6000000 },
    { id: 'PMB-0008', kind: 'Phí mở bán', vnpay: 200000, system: 200000 },
  ],
};

export const seedDisputes: Dispute[] = [
  {
    id: 'KN-09', orderId: 'MK-8810', openedAt: '20/10/2026', buyer: 'Chị Lan', seller: 'Bánh Cổ Truyền Trăng Vàng', reason: 'Hộp hoặc bánh bị hỏng khi nhận',
    buyerText: 'Nắp hộp rách, 1 bánh dập góc.', sellerProposal: { kind: 'Hoàn một phần', amount: 210000, note: 'Đồng ý 1 bánh bị dập do vận chuyển.' },
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
    id: 'KN-07', orderId: 'MK-8655', openedAt: '12/10/2026', buyer: 'Anh Dũng', seller: 'Đại lý Thu Hương', reason: 'Thiếu hoặc sai so với đơn',
    buyerText: 'Thiếu 1 hộp.', lines: [{ name: 'Hộp Thu Sắc 5 bánh mini × 2', amount: 720000 }], held: 0, paidOut: 360000, state: 'decided',
    decision: { kind: 'Hoàn một phần', amount: 360000, note: 'Người bán xác nhận giao thiếu 1 hộp.', at: '14/10/2026' },
    history: [{ label: 'Quản trị quyết định', at: '14/10/2026' }],
  },
];

/** The 34 provinces and cities after the 2025 merger (the wireframe counts 63: to confirm with the team). */
export const provinces = [
  'An Giang', 'Bắc Ninh', 'Cà Mau', 'Cao Bằng', 'Cần Thơ', 'Đà Nẵng', 'Đắk Lắk', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Nội',
  'Hà Tĩnh', 'Hải Phòng', 'Huế', 'Hưng Yên', 'Khánh Hòa', 'Lai Châu', 'Lạng Sơn', 'Lào Cai', 'Lâm Đồng', 'Nghệ An', 'Ninh Bình', 'Phú Thọ',
  'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sơn La', 'Tây Ninh', 'Thái Nguyên', 'Thanh Hóa', 'TP Hồ Chí Minh', 'Tuyên Quang', 'Vĩnh Long',
];

const NEAR = ['Bắc Ninh', 'Hưng Yên', 'Hải Phòng', 'Ninh Bình', 'Phú Thọ', 'Thái Nguyên', 'Quảng Ninh', 'Hà Nội'];
/** Cà Mau left empty on purpose: the page refuses to save with a gap (AC-52.3). */
export const seedProvinceFees: ProvinceFee[] = provinces.map((p) => ({ province: p, fee: p === 'Cà Mau' ? null : NEAR.includes(p) ? 30000 : 45000 }));

export const seedTaxonomy: Taxonomy = {
  crusts: [
    { name: 'Nướng', visible: true },
    { name: 'Dẻo', visible: true },
    { name: 'Than tre', visible: false },
  ],
  fillings: [
    { name: 'Thập cẩm', visible: true },
    { name: 'Hạt sen', visible: true },
    { name: 'Đậu xanh', visible: true },
    { name: 'Trà xanh', visible: true },
    { name: 'Khoai môn', visible: true },
  ],
};
