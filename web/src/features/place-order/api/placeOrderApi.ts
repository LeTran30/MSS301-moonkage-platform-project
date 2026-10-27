import { orderStore, type CustomOrder, type OrderLine, type ReadyOrder } from '@/entities/order';
import { mockResponse } from '@/shared/api/mock';
import { nowStamp, today } from '@/shared/utils/format';

/** After a checkout payment: one ready order per shop. Returns the new orders. */
export function createReadyOrders(
  paymentId: string,
  groups: { shop: string; lines: OrderLine[]; shippingFee: number }[],
  address: ReadyOrder['address'],
  invoice?: ReadyOrder['invoice'],
): Promise<ReadyOrder[]> {
  const base = 9930 + orderStore.get().filter((o) => o.kind === 'ready').length;
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
    history: [{ label: 'Thanh toán thành công', at: nowStamp() }],
  }));
  orderStore.update((list) => [...created, ...list]);
  return mockResponse(created);
}

/** After a deposit payment: the custom order of an accepted quote. */
export function createCustomOrder(input: Omit<CustomOrder, 'kind' | 'id' | 'step' | 'mockups' | 'progress' | 'depositPaidAt' | 'invoiceAttached'>): Promise<CustomOrder> {
  const order: CustomOrder = {
    ...input,
    kind: 'custom',
    id: `MK-C${100 + orderStore.get().filter((o) => o.kind === 'custom').length}`,
    step: 'mockup',
    mockups: [],
    depositPaidAt: today(),
    invoiceAttached: false,
    progress: [{ label: 'Đặt cọc', at: today() }],
  };
  orderStore.update((list) => [order, ...list]);
  return mockResponse(order);
}

/** After VNPay: the rest of a custom order is paid. */
export function markRemainingPaid(orderId: string): Promise<CustomOrder | null> {
  const next = orderStore.update((list) =>
    list.map((o) => (o.id === orderId && o.kind === 'custom' ? { ...o, step: 'done', progress: [...o.progress, { label: 'Bạn trả phần còn lại', at: today() }] } : o)),
  );
  return mockResponse((next.find((o) => o.id === orderId) as CustomOrder | undefined) ?? null);
}
