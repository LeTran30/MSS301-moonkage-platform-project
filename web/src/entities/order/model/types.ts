// IA Sheet 7.1 & Bảng tính:
// Trạng thái đơn mua lẻ (5 bước): Đã thanh toán -> Người bán xác nhận -> Đang giao -> Đã giao -> Hoàn tất
// REJECTED: Shop từ chối đơn đã thanh toán; tiền của đơn về ví người mua (Q-01).
export type RetailOrderStatus = 'PAID' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'COMPLETED' | 'REJECTED';

// Trạng thái đơn đặt hàng số lượng lớn (6 bước): Đã cọc -> Chờ duyệt maket (bỏ khi không custom) -> Đang sản xuất -> Sẵn sàng giao -> Đã giao -> Hoàn tất
export type BulkOrderStatus =
  'DEPOSITED' | 'WAITING_MAKET' | 'IN_PRODUCTION' | 'READY_TO_SHIP' | 'DELIVERED' | 'COMPLETED';

export type OrderType = 'RETAIL' | 'BULK';

export type MaketVersion = {
  version: number;
  imageUrl: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  feedback?: string;
};

export type ProductionProgressMilestone = {
  id: string;
  title: string;
  timestamp: string;
  note?: string;
  imageUrl?: string;
  completed: boolean;
};

export type Order = {
  id: string; // #MK-1042
  type: OrderType;
  buyerId: string;
  buyerName: string;
  vendorId: string;
  vendorName: string;
  createdAt: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  depositAmount?: number; // Cọc F2 (ví dụ 40%)
  remainingAmount?: number; // Phần còn lại (60%)
  remainingPaid?: boolean;
  status: RetailOrderStatus | BulkOrderStatus;
  items: Array<{
    /** The catalogue product; a review names it (FR-11). Absent when the catalogue product is not linked. */
    productId?: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  shippingAddress: {
    receiver: string;
    phone: string;
    address: string;
    province: string;
  };
  trackingCode?: string; // Có nếu liên tỉnh
  /** The shop and the buyer are in different provinces: shipping needs a tracking code (AC-32.3). */
  interprovince?: boolean;
  deliveredAt?: string;
  disputeDeadline?: string; // hạn khiếu nại máy chủ tính khi đơn giao (Q-10)
  hasDispute?: boolean;
  disputeId?: string;
  hasInvoice?: boolean;
  invoiceFile?: string;
  invoiceCompanyInfo?: {
    name: string;
    taxCode: string;
    address: string;
    email: string;
  };
  // Dành riêng cho Bulk (F2)
  /** The custom order has custom work (BR-14): the buyer approves a maket before production. */
  hasCustom?: boolean;
  /** The accepted quote a custom order came from (F2); leads back to the buyer's request. */
  quoteId?: string;
  customLogo?: string;
  customRequirements?: string;
  maketVersions?: MaketVersion[];
  progressMilestones?: ProductionProgressMilestone[];
  disbursementRequested?: boolean; // B5.2, Q4.1
};
