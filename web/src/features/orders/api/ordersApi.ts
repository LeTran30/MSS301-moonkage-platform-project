import { mockResponse, seedStore } from '../../../shared/api/mock';
import { seedComplaints, seedOrders } from './seed';
import type { Complaint, CustomOrder, Order, OrderLine, ReadyOrder } from './types';

/** Not on the backend yet: answers from the seed (seed.ts); changes are kept in the demo store. */
const orders = seedStore<Order[]>('buyer-orders', seedOrders);
const complaints = seedStore<Complaint[]>('buyer-complaints', seedComplaints);

const today = () => new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const now = () => `${today()} ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;

export function fetchOrders(): Promise<Order[]> {
  return mockResponse(orders.get());
}

export function fetchOrder(orderId: string): Promise<Order | null> {
  return mockResponse(orders.get().find((o) => o.id === orderId) ?? null);
}

function patch<T extends Order>(orderId: string, change: (o: T) => T): Promise<Order | null> {
  const next = orders.update((list) => list.map((o) => (o.id === orderId ? change(o as T) : o)));
  return mockResponse(next.find((o) => o.id === orderId) ?? null);
}

export function confirmReceived(orderId: string) {
  return patch<ReadyOrder>(orderId, (o) => ({
    ...o,
    status: 'delivered',
    deliveredAt: today(),
    history: [{ label: 'Bạn xác nhận đã nhận hàng', at: now() }, ...o.history],
  }));
}

export function approveMockup(orderId: string) {
  return patch<CustomOrder>(orderId, (o) => ({
    ...o,
    step: 'production',
    mockups: o.mockups.map((m, i) => (i === 0 ? { ...m, state: 'approved' } : m)),
    progress: [...o.progress, { label: `Bạn duyệt maket lần ${o.mockups[0]?.version ?? 1}`, at: today() }],
  }));
}

export function requestRevision(orderId: string, feedback: string) {
  return patch<CustomOrder>(orderId, (o) => ({
    ...o,
    mockups: o.mockups.map((m, i) => (i === 0 ? { ...m, state: 'revise', feedback } : m)),
    progress: [...o.progress, { label: 'Bạn yêu cầu sửa maket', at: today() }],
  }));
}

/** After VNPay: the rest of a custom order is paid. */
export function markRemainingPaid(orderId: string) {
  return patch<CustomOrder>(orderId, (o) => ({ ...o, step: 'done', progress: [...o.progress, { label: 'Bạn trả phần còn lại', at: today() }] }));
}

/** After a checkout payment: one ready order per shop. Returns the new orders. */
export function createReadyOrders(
  paymentId: string,
  groups: { shop: string; lines: OrderLine[]; shippingFee: number }[],
  address: ReadyOrder['address'],
  invoice?: ReadyOrder['invoice'],
): Promise<ReadyOrder[]> {
  const base = 9930 + orders.get().filter((o) => o.kind === 'ready').length;
  const created: ReadyOrder[] = groups.map((g, i) => ({
    kind: 'ready',
    id: `MK-${base + i}`,
    shop: g.shop,
    paymentId,
    placedAt: today(),
    lines: g.lines,
    shippingFee: g.shippingFee,
    status: 'pending',
    address,
    invoice,
    complaintDays: 3,
    history: [{ label: 'Thanh toán thành công', at: now() }],
  }));
  orders.update((list) => [...created, ...list]);
  return mockResponse(created);
}

/** After a deposit payment: the custom order of an accepted quote. */
export function createCustomOrder(input: Omit<CustomOrder, 'kind' | 'id' | 'step' | 'mockups' | 'progress' | 'depositPaidAt' | 'invoiceAttached'>): Promise<CustomOrder> {
  const order: CustomOrder = {
    ...input,
    kind: 'custom',
    id: `MK-C${100 + orders.get().filter((o) => o.kind === 'custom').length}`,
    step: 'mockup',
    mockups: [],
    depositPaidAt: today(),
    invoiceAttached: false,
    progress: [{ label: 'Đặt cọc', at: today() }],
  };
  orders.update((list) => [order, ...list]);
  return mockResponse(order);
}

export function fetchComplaintOfOrder(orderId: string): Promise<Complaint | null> {
  return mockResponse(complaints.get().find((c) => c.orderId === orderId) ?? null);
}

export function sendComplaint(orderId: string, shop: string, reason: string, description: string, photos: number): Promise<Complaint> {
  const complaint: Complaint = {
    id: `KN-${500 + complaints.get().length}`,
    orderId,
    shop,
    reason,
    description,
    photos,
    sentAt: today(),
    events: [{ label: 'Bạn gửi báo vấn đề', at: today() }],
  };
  complaints.update((list) => [complaint, ...list]);
  orders.update((list) => list.map((o) => (o.id === orderId && o.kind === 'ready' ? { ...o, complaintId: complaint.id } : o)));
  return mockResponse(complaint);
}
