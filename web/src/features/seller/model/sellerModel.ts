import type { Tone } from '../../../shared/ui';
import type { CustomTerms, SellerCustomOrder, SellerOrder, SellerOrderStatus, SellerReadyOrder, Settlement } from '../api/types';

/** One-off fee after the profile is approved (Q6.2 sets it). */
export const SELLER_FEE = 200000;

export const orderStatusLabel: Record<SellerOrderStatus, { label: string; tone: Tone }> = {
  new: { label: 'Chờ xác nhận', tone: 'warn' },
  confirmed: { label: 'Đã xác nhận', tone: 'soft' },
  shipping: { label: 'Đang giao', tone: 'brand' },
  delivered: { label: 'Đã giao', tone: 'ok' },
  cancelled: { label: 'Đã hủy', tone: 'muted' },
};

export const customStepLabel: Record<SellerCustomOrder['step'], string> = {
  mockup: 'Gửi maket',
  production: 'Sản xuất',
  delivery: 'Giao hàng',
  remaining: 'Người mua trả phần còn lại',
  done: 'Hoàn tất',
};

export const goods = (o: SellerReadyOrder) => o.lines.reduce((n, l) => n + l.price * l.quantity, 0);

/** Orders of each tab of B2.0. */
export type OrderTab = 'todo' | 'shipping' | 'delivered' | 'no-invoice' | 'complaint';
export function inTab(o: SellerReadyOrder, tab: OrderTab): boolean {
  if (tab === 'todo') return o.status === 'new' || o.status === 'confirmed';
  if (tab === 'shipping') return o.status === 'shipping';
  if (tab === 'delivered') return o.status === 'delivered';
  if (tab === 'no-invoice') return o.status === 'delivered' && !o.invoiceAttached;
  return Boolean(o.complaint && !o.complaint.proposal);
}

/** Overview counters (B1.0 "Việc cần làm"). */
export function sellerTodo(orders: SellerOrder[], newRequests: number) {
  const ready = orders.filter((o): o is SellerReadyOrder => o.kind === 'ready');
  const custom = orders.filter((o): o is SellerCustomOrder => o.kind === 'custom');
  return {
    newOrders: ready.filter((o) => o.status === 'new').length,
    newRequests,
    revise: custom.filter((o) => o.feedback).length,
    reviseOrder: custom.find((o) => o.feedback)?.id,
    noInvoice: ready.filter((o) => o.status === 'delivered' && !o.invoiceAttached).length,
    complaints: ready.filter((o) => o.complaint && !o.complaint.proposal),
  };
}

export const settlementTotal = (s: Settlement) => s.goods + s.shipping;

/** Price per box suggested by the seller's tiers for `boxes`. */
export function tierPrice(terms: CustomTerms, boxes: number): number | null {
  const tier = terms.tiers.find((t) => boxes >= t.from && (t.to === null || boxes <= t.to));
  return tier?.price ?? null;
}
