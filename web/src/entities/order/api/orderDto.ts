import { ApiError, apiClient, type ApiResponse } from '@/shared/api/client';
import { ordersPath } from '@/shared/api/gateway';
import { HTTP_NOT_FOUND } from '@/shared/api/httpStatus';
import { provinceNameOf } from '@/shared/config/provinces';
import { formatDate, formatDateTime } from '@/shared/utils/format';

/** order-service `OrderStatus` (7.1). */
export type OrderStatusDto =
  | 'PAID'
  | 'CONFIRMED'
  | 'SHIPPING'
  | 'DEPOSITED'
  | 'AWAITING_MOCKUP_APPROVAL'
  | 'IN_PRODUCTION'
  | 'READY_TO_SHIP'
  | 'DELIVERED'
  | 'COMPLETED';

/** order-service `OrderResponse`; `items` is empty in a list. */
export interface OrderDto {
  id: string;
  kind: 'BUY_NOW' | 'CUSTOM_ORDER';
  status: OrderStatusDto;
  buyerAccountId: string;
  vendorId: string;
  paymentGroupId: string | null;
  quoteId: string | null;
  itemsAmount: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  depositAmount: number | null;
  remainingAmount: number | null;
  interprovince: boolean;
  hasCustom: boolean;
  recipientName: string;
  recipientPhone: string;
  provinceCode: string;
  addressDetail: string;
  deliveryDate: string | null;
  deliveryMethod: string | null;
  trackingCode: string | null;
  invoiceInfo: { name: string; taxCode: string; address: string; email: string } | null;
  hasInvoiceFile: boolean;
  deliveredAt: string | null;
  receivedConfirmedAt: string | null;
  complaintDeadline: string | null;
  createdAt: string;
  items: { productId: string; productName: string; unitPrice: number; quantity: number; subtotal: number }[];
}

export interface ProgressUpdateDto {
  milestone: OrderStatusDto;
  note: string | null;
  photoKeys: string[];
  createdAt: string;
}

export type MockupReviewStatusDto = 'PENDING_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED';

export interface MockupDto {
  versionNo: number;
  downloadUrl: string;
  reviewStatus: MockupReviewStatusDto;
  reviewNote: string | null;
  uploadedAt: string;
  reviewedAt: string | null;
}

/** An order with what its detail views need besides the order itself. */
export interface OrderBundle {
  order: OrderDto;
  progress: ProgressUpdateDto[];
  mockups: MockupDto[];
}

interface PageDto<T> {
  content: T[];
}

/** Far above the orders of one account or Shop in the pilot; the list has no paging UI. */
const ORDER_PAGE_SIZE = 100;
const DAY_MS = 86_400_000;

const milestoneLabel: Record<OrderStatusDto, string> = {
  PAID: 'Thanh toán thành công',
  CONFIRMED: 'Shop xác nhận đơn',
  SHIPPING: 'Đang giao',
  DEPOSITED: 'Đặt cọc',
  AWAITING_MOCKUP_APPROVAL: 'Gửi maket',
  IN_PRODUCTION: 'Bắt đầu sản xuất',
  READY_TO_SHIP: 'Sản xuất xong, chờ giao',
  DELIVERED: 'Đã giao',
  COMPLETED: 'Hoàn tất',
};

export const orderPath = (orderId: string) => `${ordersPath}/${encodeURIComponent(orderId)}`;

/** Oldest first, as the server answers. */
export function historyOf(progress: ProgressUpdateDto[]): { label: string; at: string }[] {
  return progress.map((p) => ({
    label: p.note ? `${milestoneLabel[p.milestone]} · ${p.note}` : milestoneLabel[p.milestone],
    at: formatDateTime(p.createdAt),
  }));
}

export const dateOf = (iso: string | null) => (iso ? formatDate(iso) : undefined);

/** Whole days between delivery and the end of the complaint window (D-13); 0 before delivery. */
export function complaintDaysOf(o: OrderDto): number {
  if (!o.deliveredAt || !o.complaintDeadline) return 0;
  return Math.round((new Date(o.complaintDeadline).getTime() - new Date(o.deliveredAt).getTime()) / DAY_MS);
}

/** A custom order's title: what was quoted, from its lines. */
export const titleOf = (o: OrderDto) => o.items.map((i) => `${i.quantity} ${i.productName}`).join(', ');

/** Deposit share of the order value, unrounded so `depositAmount()` gives back the server's amount. */
export const depositPercentOf = (o: OrderDto) => (o.totalAmount > 0 ? ((o.depositAmount ?? 0) * 100) / o.totalAmount : 0);

export const deliverToOf = (o: OrderDto) => provinceNameOf(o.provinceCode);

export const linesOf = (o: OrderDto) => o.items.map((i) => ({ name: i.productName, price: i.unitPrice, quantity: i.quantity }));

/** Newest version first, as the views show them. */
export const newestFirst = (mockups: MockupDto[]) => [...mockups].sort((a, b) => b.versionNo - a.versionNo);

async function fetchBundle(orderId: string, kind?: OrderDto['kind']): Promise<OrderBundle> {
  const [order, progress] = await Promise.all([
    apiClient.get<ApiResponse<OrderDto>>(orderPath(orderId)).then((r) => r.data.data),
    apiClient.get<ApiResponse<ProgressUpdateDto[]>>(`${orderPath(orderId)}/progress-updates`).then((r) => r.data.data ?? []),
  ]);
  const mockups =
    (kind ?? order.kind) === 'CUSTOM_ORDER'
      ? await apiClient.get<ApiResponse<MockupDto[]>>(`${orderPath(orderId)}/mockups`).then((r) => r.data.data ?? [])
      : [];
  return { order, progress, mockups };
}

/** One order with its history and mockups; null when the caller has no such order. */
export async function fetchOrderBundle(orderId: string): Promise<OrderBundle | null> {
  try {
    return await fetchBundle(orderId);
  } catch (e) {
    if (e instanceof ApiError && e.status === HTTP_NOT_FOUND) return null;
    throw e;
  }
}

/** The list has no lines (items empty): each order is read again with them. */
export async function fetchOrderBundles(params: Record<string, string> = {}): Promise<OrderBundle[]> {
  const res = await apiClient.get<ApiResponse<PageDto<OrderDto>>>(ordersPath, { params: { ...params, size: ORDER_PAGE_SIZE } });
  return Promise.all((res.data.data.content ?? []).map((o) => fetchBundle(o.id, o.kind)));
}

/** order-service `DisputeResponse`: the dispute of an order with both parties' evidence (AC-49.1). */
export interface DisputeDto {
  disputeId: string;
  orderId: string;
  reason: string;
  description: string;
  status: 'OPEN' | 'RESOLVED';
  decision: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'REJECTED' | null;
  refundAmount: number | null;
  decisionReason: string | null;
  createdAt: string;
  resolvedAt: string | null;
  evidences: { party: 'BUYER' | 'VENDOR'; downloadUrl: string; note: string | null; createdAt: string }[];
}

/** The order's latest dispute, null when it never had one. */
export async function fetchDispute(orderId: string): Promise<DisputeDto | null> {
  try {
    const res = await apiClient.get<ApiResponse<DisputeDto>>(`${orderPath(orderId)}/dispute`);
    return res.data.data;
  } catch (e) {
    if (e instanceof ApiError && e.status === HTTP_NOT_FOUND) return null;
    throw e;
  }
}

/** Ids of the orders with an open dispute among those `params` select (FR-49). */
export async function fetchOpenDisputeOrderIds(params: Record<string, string> = {}): Promise<Set<string>> {
  const res = await apiClient.get<ApiResponse<PageDto<OrderDto>>>(ordersPath, {
    params: { ...params, disputeStatus: 'OPEN', size: ORDER_PAGE_SIZE },
  });
  return new Set((res.data.data.content ?? []).map((o) => o.id));
}
