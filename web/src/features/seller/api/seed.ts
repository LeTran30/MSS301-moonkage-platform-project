import type {
  CustomTerms,
  DeliveryZones,
  Disbursement,
  IncomingRequest,
  SellerOrder,
  SellerProduct,
  SellerProfile,
  Settlement,
  ShopNotification,
} from './types';

/** Seller seed from the wireframe (b1-0 … b7-0), for Xưởng Bánh Nghệ Nhân. */
export const openProfile: SellerProfile = {
  state: 'open', shopName: 'Xưởng Bánh Nghệ Nhân', kind: 'Hộ kinh doanh', regNo: '01J8001928', address: '12 Phan Kế Bính, Ba Đình, Hà Nội',
  ownerName: 'VŨ THỊ MAI HOA', ownerId: '0011******22', submittedAt: '22/10/2026', approvedAt: '24/10/2026', ways: { shop: true, custom: true },
};

/** The profile of the "chờ duyệt" demo account; Admin (Q2.1) moves it on. */
export const pendingProfile: SellerProfile = {
  state: 'pending', shopName: 'Tiệm Bánh Thảo Mộc', kind: 'Hộ kinh doanh', regNo: '01K9002231', address: '8 Ngõ Huế, Hai Bà Trưng, Hà Nội',
  ownerName: 'PHẠM THU THẢO', ownerId: '0012******47', submittedAt: '23/10/2026', ways: { shop: true, custom: false },
};

export const seedSellerOrders: SellerOrder[] = [
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

export const seedProducts: SellerProduct[] = [
  { id: 'hop-hoang-kim-4-banh', name: 'Hộp Hoàng Kim 4 bánh', crusts: ['Nướng'], fillings: ['Thập cẩm', 'Hạt sen'], price: 680000, stock: 42, visible: true },
  { id: 'hop-doan-vien-6-banh', name: 'Hộp Đoàn Viên 6 bánh', crusts: ['Nướng'], fillings: ['Thập cẩm', 'Hạt sen', 'Đậu xanh'], price: 890000, stock: 9, visible: true },
  { id: 'banh-nuong-dau-xanh-200g', name: 'Bánh nướng đậu xanh 200g', crusts: ['Nướng'], fillings: ['Đậu xanh'], price: 85000, stock: 3, visible: true },
  { id: 'hop-hat-sen-2-banh', name: 'Hộp Hạt Sen 2 bánh', crusts: ['Nướng'], fillings: ['Hạt sen'], price: 320000, stock: 15, visible: false },
  { id: 'hop-thu-vang-4-banh', name: 'Hộp Thu Vàng 4 bánh', crusts: ['Nướng'], fillings: ['Thập cẩm', 'Đậu xanh'], price: 450000, stock: 12, visible: false, removed: { at: '20/10/2026', reason: 'Ảnh không đúng sản phẩm' } },
];

export const seedSettlements: Settlement[] = [
  { orderId: 'MK-9921', deliveredAt: '24/10/2026', goods: 680000, shipping: 25000, state: 'Chờ hết hạn khiếu nại' },
  { orderId: 'MK-8810', deliveredAt: '19/10/2026', goods: 840000, shipping: 35000, state: 'Tạm dừng · khiếu nại' },
  { orderId: 'MK-8702', deliveredAt: '12/10/2026', goods: 1260000, shipping: 25000, state: 'Đã chuyển 16/10/2026' },
];

export const seedDisbursements: Disbursement[] = [
  { orderId: 'MK-C071', milestone: 'Đã duyệt maket, mua nguyên liệu', amount: 3000000, heldAfter: 3000000, state: 'Đã giải ngân 21/10/2026' },
  { orderId: 'MK-C088', milestone: 'Chưa duyệt maket', amount: null, heldAfter: 9000000, state: 'Chưa xin được' },
];

export const seedZones: DeliveryZones = { homeProvince: 'Hà Nội', homeAll: true, homeFee: 25000, interProvince: true };

export const seedTerms: CustomTerms = {
  minBoxes: 20, mockupHours: 24, crusts: ['Nướng', 'Dẻo'], fillings: ['Thập cẩm', 'Hạt sen', 'Đậu xanh'], custom: ['In / khắc logo lên hộp', 'Thiệp kèm'],
  tiers: [
    { from: 20, to: 99, price: 130000 },
    { from: 100, to: 199, price: 120000 },
    { from: 200, to: null, price: 110000 },
  ],
};

export const seedShopNotifications: ShopNotification[] = [
  { id: 's1', title: 'Đơn mới MK-9930', detail: '2 hộp Hoàng Kim', source: 'Người mua Anh Tuấn', when: '3 giờ trước', unread: true, to: '/kenh-ban/don-hang/MK-9930' },
  { id: 's2', title: 'Yêu cầu báo giá mới YC-104', detail: '150 hộp in logo', source: 'Hạn gửi báo giá còn 18 giờ', when: 'Hôm qua', unread: true, to: '/kenh-ban/yeu-cau/YC-104' },
  { id: 's3', title: 'Người mua yêu cầu sửa maket', detail: 'Đơn MK-C088', source: 'Công ty TNHH Mặt Trời', when: '22/10/2026', unread: false, to: '/kenh-ban/don-hang/MK-C088' },
  { id: 's4', title: 'Đợt giải ngân cọc đã chuyển', detail: 'Đơn MK-C071', source: 'Moonkage', when: '21/10/2026', unread: false, to: '/kenh-ban/tien/giai-ngan' },
];

export const interProvinceFees = [
  { province: 'TP Hồ Chí Minh', fee: 35000 },
  { province: 'Đà Nẵng', fee: 35000 },
  { province: 'Hải Phòng', fee: 30000 },
  { province: 'Cần Thơ', fee: 40000 },
];
