import type { Tone } from '@/shared/ui';
import type { VendorCustomOrder, VendorOrder, VendorOrderStatus, VendorReadyOrder } from './vendorOrderTypes';

export const orderStatusLabel: Record<VendorOrderStatus, { label: string; tone: Tone }> = {
  new: { label: 'Chờ xác nhận', tone: 'warn' },
  confirmed: { label: 'Đã xác nhận', tone: 'soft' },
  shipping: { label: 'Đang giao', tone: 'brand' },
  delivered: { label: 'Đã giao', tone: 'ok' },
  cancelled: { label: 'Đã hủy', tone: 'muted' },
};

export const customStepLabel: Record<VendorCustomOrder['step'], string> = {
  mockup: 'Gửi maket',
  production: 'Sản xuất',
  delivery: 'Giao hàng',
  remaining: 'Người mua trả phần còn lại',
  done: 'Hoàn tất',
};

/** The step the vendor moves a custom order to next (FR-40, FR-42); the buyer's payment ends 'remaining'. */
export const nextCustomStep: Partial<Record<VendorCustomOrder['step'], VendorCustomOrder['step']>> = {
  mockup: 'production',
  production: 'delivery',
  delivery: 'remaining',
};

/** The shop answered the complaint: a proposal (demo) or evidence with a note (server). */
export const complaintAnswered = (c: NonNullable<VendorReadyOrder['complaint']>) => Boolean(c.proposal || c.replies?.length);

export const goods = (o: VendorReadyOrder) => o.lines.reduce((n, l) => n + l.price * l.quantity, 0);

/** Orders of each tab of B2.0. */
export type OrderTab = 'todo' | 'shipping' | 'delivered' | 'no-invoice' | 'complaint';
export function inTab(o: VendorReadyOrder, tab: OrderTab): boolean {
  if (tab === 'todo') return o.status === 'new' || o.status === 'confirmed';
  if (tab === 'shipping') return o.status === 'shipping';
  if (tab === 'delivered') return o.status === 'delivered';
  if (tab === 'no-invoice') return o.status === 'delivered' && !o.invoiceAttached;
  return Boolean(o.complaint && !complaintAnswered(o.complaint));
}

/** Overview counters (B1.0 "Việc cần làm"). */
export function vendorTodo(orders: VendorOrder[], newRequests: number) {
  const ready = orders.filter((o): o is VendorReadyOrder => o.kind === 'ready');
  const custom = orders.filter((o): o is VendorCustomOrder => o.kind === 'custom');
  return {
    newOrders: ready.filter((o) => o.status === 'new').length,
    newRequests,
    revise: custom.filter((o) => o.feedback).length,
    reviseOrder: custom.find((o) => o.feedback)?.id,
    noInvoice: ready.filter((o) => o.status === 'delivered' && !o.invoiceAttached).length,
    complaints: ready.filter((o) => o.complaint && !complaintAnswered(o.complaint)),
  };
}
