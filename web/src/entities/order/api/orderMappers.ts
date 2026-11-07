import { provinceNameOf } from '@/shared/config';
import type { Order } from '../model/types';
import type {
  OrderDto,
  ProgressUpdate,
  ProgressUpdateDto,
  UiOrderStatus,
  BackendOrderStatus,
} from './orderDto';
const STATUS_MAP: Record<string, UiOrderStatus> = {
  PAID: 'PAID',
  CONFIRMED: 'CONFIRMED',
  SHIPPING: 'SHIPPING',
  DEPOSITED: 'DEPOSITED',
  AWAITING_MOCKUP_APPROVAL: 'WAITING_MAKET',
  IN_PRODUCTION: 'IN_PRODUCTION',
  READY_TO_SHIP: 'READY_TO_SHIP',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
};

/** Map a backend status to the UI status; unknown statuses fall back to `PAID`. */
export function mapOrderStatus(status: string | undefined): UiOrderStatus {
  if (!status) return 'PAID';
  return STATUS_MAP[status] ?? 'PAID';
}

/** Backend `kind` is `BUY_NOW | CUSTOM_ORDER`; the UI type is `RETAIL | BULK`. */
export function mapOrderKind(kind: string | undefined): Order['type'] {
  return kind === 'CUSTOM_ORDER' ? 'BULK' : 'RETAIL';
}

/**
 * The backend status of a UI status.
 *
 * The write side sends the backend's own enum (the root checks the
 * transition, README §3), so the UI status has to be translated back.
 */
export function toBackendOrderStatus(status: UiOrderStatus): BackendOrderStatus {
  if (status === 'WAITING_MAKET') return 'AWAITING_MOCKUP_APPROVAL';
  return status;
}

/**
 * The next status of an order, or `null` when the order is at its last step.
 *
 * The backend moves an order one step forward and refuses a jump with 409
 * `INVALID_STATE_TRANSITION`, so the UI offers exactly the next step.
 */
export function nextOrderStatus(order: Pick<Order, 'status' | 'hasCustom'>): UiOrderStatus | null {
  // BR-15: a custom order without custom work has no maket to approve.
  if (order.status === 'DEPOSITED' && !order.hasCustom) return 'IN_PRODUCTION';
  const flow: Record<string, UiOrderStatus> = {
    PAID: 'CONFIRMED',
    CONFIRMED: 'SHIPPING',
    DEPOSITED: 'WAITING_MAKET',
    WAITING_MAKET: 'IN_PRODUCTION',
    IN_PRODUCTION: 'READY_TO_SHIP',
    READY_TO_SHIP: 'DELIVERED',
    SHIPPING: 'DELIVERED',
  };
  return flow[order.status] ?? null;
}

/**
 * The Shop may send a maket version (FR-39): a custom order with custom work, before production.
 *
 * Sending the first version is what moves a DEPOSITED order to WAITING_MAKET; a later version answers the
 * buyer's request for changes.
 */
export function canSendMaket(order: Pick<Order, 'type' | 'status' | 'hasCustom'>): boolean {
  return (
    order.type === 'BULK' &&
    order.hasCustom === true &&
    (order.status === 'DEPOSITED' || order.status === 'WAITING_MAKET')
  );
}

export function mapOrderDtoToEntity(dto: OrderDto): Order {
  const subtotal = dto.itemsAmount ?? 0;
  const shippingFee = dto.shippingFee ?? 0;
  const total = dto.totalAmount ?? subtotal + shippingFee;

  return {
    id: dto.id,
    type: mapOrderKind(dto.kind),
    buyerId: dto.buyerAccountId || '',
    buyerName: dto.recipientName || '',
    vendorId: dto.vendorId || '',
    vendorName: dto.vendorName || '',
    createdAt: dto.createdAt || new Date().toISOString(),
    subtotal,
    shippingFee,
    total,
    depositAmount: dto.depositAmount ?? undefined,
    remainingAmount: dto.remainingAmount ?? undefined,
    // Đơn đặt riêng chỉ hoàn tất khi phần còn lại đã về (FR-22); đơn mua ngay trả đủ từ đầu.
    remainingPaid: dto.kind !== 'CUSTOM_ORDER' || dto.status === 'COMPLETED',
    status: mapOrderStatus(dto.status),
    deliveredAt: dto.deliveredAt,
    disputeDeadline: dto.complaintDeadline,
    hasDispute: false,
    trackingCode: dto.trackingCode,
    interprovince: dto.interprovince === true,
    hasCustom: dto.hasCustom === true,
    quoteId: dto.quoteId ?? undefined,
    shippingAddress: {
      receiver: dto.recipientName ?? '',
      phone: dto.recipientPhone ?? '',
      address: dto.addressDetail ?? '',
      province: provinceNameOf(dto.provinceCode) || dto.provinceCode || '',
    },
    items: (dto.items ?? []).map((item) => ({
      productId: item.productId,
      name: item.productName,
      quantity: item.quantity,
      price: item.unitPrice,
      // Ảnh bìa đơn giữ lại lúc mua; trống ⇒ UI hiện ô đại diện trung tính, không dùng ảnh mẫu.
      image: item.imageUrl ?? '',
    })),
    hasInvoice: Boolean(dto.invoiceInfo),
    invoiceCompanyInfo: dto.invoiceInfo,
  };
}

/** Map a backend progress update to the UI entity. */
export function mapProgressUpdateDto(dto: ProgressUpdateDto): ProgressUpdate {
  return {
    // Lịch sử ghi enum của backend (AWAITING_MOCKUP_APPROVAL…); đổi về trạng thái UI để hiện đúng nhãn.
    milestone: STATUS_MAP[dto.milestone] ?? (dto.milestone as Order['status']),
    note: dto.note ?? undefined,
    photoKeys: dto.photoKeys ?? [],
    createdAt: dto.createdAt ?? new Date().toISOString(),
  };
}
