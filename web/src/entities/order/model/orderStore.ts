import { createStore } from '@/shared/lib';
import { isDemoMode } from '@/shared/config';
import type { Order } from './types';

export const MOCK_ORDERS: Order[] = [
  {
    id: 'MK-1042',
    type: 'RETAIL',
    buyerId: 'usr_minh',
    buyerName: 'Anh Minh',
    vendorId: 'ven_quan',
    vendorName: 'Hiệu Bánh Gia Truyền Bảo An',
    createdAt: '2026-10-24T09:30:00Z',
    subtotal: 950000,
    shippingFee: 25000,
    total: 975000,
    status: 'DELIVERED',
    deliveredAt: '2026-10-25T14:00:00Z',
    disputeDeadline: '2026-10-28T14:00:00Z', // Còn trong hạn khiếu nại (3 ngày)
    hasDispute: false,
    trackingCode: 'VNP-8839210',
    shippingAddress: {
      receiver: 'Anh Minh',
      phone: '0903123456',
      address: 'Phòng 402, Tòa Nhà Hoàng Gia, 180 Triệu Việt Vương',
      province: 'Hà Nội',
    },
    items: [
      {
        name: 'Bánh Nướng Thập Cẩm Gà Quay 2 Trứng Muối',
        quantity: 2,
        price: 135000,
        image: '/images/banh-nuong.jpg',
      },
      {
        name: 'Hộp Quà Trăng Vàng Đoàn Viên (4 Bánh Cao Cấp)',
        quantity: 1,
        price: 680000,
        image: '/images/hop-qua.jpg',
      },
    ],
  },
  {
    id: 'MK-9821',
    type: 'BULK',
    buyerId: 'usr_lan',
    buyerName: 'Chị Lan (HR Doanh nghiệp)',
    vendorId: 'ven_hoa',
    vendorName: 'Xưởng Bánh Truyền Thống Cô Hoa',
    createdAt: '2026-10-20T11:00:00Z',
    subtotal: 22500000, // 150 hộp x 150k
    shippingFee: 0,
    total: 22500000,
    depositAmount: 9000000, // 40% cọc
    remainingAmount: 13500000,
    remainingPaid: false,
    status: 'WAITING_MAKET', // Chờ duyệt maket
    shippingAddress: {
      receiver: 'Tập đoàn Aurora Global - C/O Chị Lan',
      phone: '0918889999',
      address: 'Tầng 18, Tòa tháp Capital Place, 29 Liễu Giai, Ba Đình',
      province: 'Hà Nội',
    },
    items: [
      {
        name: 'Hộp 2 Bánh Truyền Thống In Logo Ép Kim Aurora Global',
        quantity: 150,
        price: 150000,
        image: '/images/doanh-nghiep.jpg',
      },
    ],
    customLogo: 'Logo Aurora Global (file vector)',
    customRequirements: 'Ép kim nhũ vàng trên nắp hộp đỏ mận, túi giấy quai lụa kèm thiệp chúc mừng',
    maketVersions: [
      {
        version: 1,
        imageUrl: '/images/doanh-nghiep.jpg',
        submittedAt: '2026-10-22T08:30:00Z',
        status: 'PENDING',
        comment: 'Cô Hoa gửi maket bản 1: Ép kim logo Aurora mặt trước hộp và trên thiệp.',
      },
    ],
    progressMilestones: [
      { id: 'm1', title: 'Tiếp nhận đơn & Đặt cọc thành công', timestamp: '2026-10-20T11:30:00Z', completed: true },
      { id: 'm2', title: 'Thiết kế & Duyệt maket hộp', timestamp: '2026-10-22T08:30:00Z', completed: false },
      { id: 'm3', title: 'Sản xuất bánh & In bao bì', timestamp: '', completed: false },
      { id: 'm4', title: 'Đóng gói & Kiểm định chất lượng', timestamp: '', completed: false },
      { id: 'm5', title: 'Giao hàng tận nơi & Nghiệm thu', timestamp: '', completed: false },
    ],
    invoiceCompanyInfo: {
      name: 'Công ty Cổ phần Công nghệ Aurora Global',
      taxCode: '0109988776',
      address: 'Tầng 18, Tòa tháp Capital Place, 29 Liễu Giai, Ba Đình, Hà Nội',
      email: 'finance@auroraglobal.vn',
    },
    hasInvoice: true,
  },
];

/**
 * The orders of the caller.
 *
 * In demo mode the store starts with the mock list; against a live backend it
 * starts empty and is filled by `useOrders` from `order-service`.
 */
export const orderStore = createStore<Order[]>(
  isDemoMode() ? MOCK_ORDERS : [],
  isDemoMode() ? 'moonkage_orders' : undefined
);

export function approveMaket(orderId: string, version: number) {
  orderStore.set((prev) =>
    prev.map((o) => {
      if (o.id !== orderId || !o.maketVersions) return o;
      return {
        ...o,
        status: 'IN_PRODUCTION',
        maketVersions: o.maketVersions.map((mv) => (mv.version === version ? { ...mv, status: 'APPROVED' } : mv)),
        progressMilestones: o.progressMilestones?.map((m) =>
          m.id === 'm2' ? { ...m, completed: true, timestamp: new Date().toISOString() } : m
        ),
      };
    })
  );
}

export function requestMaketRevision(orderId: string, version: number, feedback: string) {
  orderStore.set((prev) =>
    prev.map((o) => {
      if (o.id !== orderId || !o.maketVersions) return o;
      return {
        ...o,
        maketVersions: o.maketVersions.map((mv) =>
          mv.version === version ? { ...mv, status: 'REJECTED', feedback } : mv
        ),
      };
    })
  );
}
