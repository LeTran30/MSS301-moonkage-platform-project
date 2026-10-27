import { routes } from '@/shared/config/routes';
import type { Task, Tone } from '@/shared/ui';
import { formatVnd } from '@/shared/utils/money';
import type { CustomOrder, CustomStep, Order, ReadyOrder, ReadyStatus } from './types';

export const readyStatusLabel: Record<ReadyStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Chờ xác nhận', tone: 'soft' },
  shipping: { label: 'Đang giao', tone: 'brand' },
  delivered: { label: 'Đã giao', tone: 'ok' },
  cancelled: { label: 'Đã hủy', tone: 'muted' },
};

export const customSteps: { key: CustomStep; label: string }[] = [
  { key: 'deposit', label: 'Đặt cọc' },
  { key: 'mockup', label: 'Duyệt maket' },
  { key: 'production', label: 'Sản xuất' },
  { key: 'delivery', label: 'Giao hàng' },
  { key: 'remaining', label: 'Trả phần còn lại' },
];

/** What the buyer sees as the state of a custom order. */
export function customStatus(o: CustomOrder): { label: string; tone: Tone } {
  if (o.step === 'mockup') {
    const latest = o.mockups[0];
    if (!latest) return { label: 'Chờ đơn vị gửi maket', tone: 'soft' };
    return latest.state === 'waiting' ? { label: 'Chờ bạn duyệt maket', tone: 'warn' } : { label: 'Chờ maket mới', tone: 'soft' };
  }
  if (o.step === 'production') return { label: 'Đang sản xuất', tone: 'brand' };
  if (o.step === 'delivery') return { label: 'Đang giao', tone: 'brand' };
  if (o.step === 'remaining') return { label: 'Chờ trả phần còn lại', tone: 'warn' };
  if (o.step === 'done') return { label: 'Hoàn tất', tone: 'ok' };
  return { label: 'Chờ đặt cọc', tone: 'soft' };
}

export function stepIndex(step: CustomStep): number {
  return step === 'done' ? customSteps.length : customSteps.findIndex((s) => s.key === step);
}

export const goodsTotal = (o: ReadyOrder) => o.lines.reduce((n, l) => n + l.price * l.quantity, 0);
export const readyTotal = (o: ReadyOrder) => goodsTotal(o) + o.shippingFee;
export const depositAmount = (o: CustomOrder) => Math.round((o.value * o.depositPercent) / 100);
export const remainingAmount = (o: CustomOrder) => o.value - depositAmount(o);

/** Days left to report a problem on a delivered ready order; null when the window does not apply. */
export function complaintDaysLeft(o: ReadyOrder, today = new Date()): number | null {
  if (o.status !== 'delivered' || !o.deliveredAt) return null;
  const [d, m, y] = o.deliveredAt.split('/').map(Number);
  const delivered = new Date(y, m - 1, d);
  const elapsed = Math.floor((today.getTime() - delivered.getTime()) / 86400000);
  return o.complaintDays - elapsed;
}

/** Ready orders grouped by the VNPay payment that created them, newest payment first. */
export function groupByPayment(orders: Order[]): { paymentId: string; placedAt: string; total: number; orders: ReadyOrder[] }[] {
  const groups = new Map<string, ReadyOrder[]>();
  orders.filter((o): o is ReadyOrder => o.kind === 'ready').forEach((o) => groups.set(o.paymentId, [...(groups.get(o.paymentId) ?? []), o]));
  return [...groups.entries()].map(([paymentId, list]) => ({
    paymentId,
    placedAt: list[0].placedAt,
    total: list.reduce((n, o) => n + readyTotal(o), 0),
    orders: list,
  }));
}

/** What the buyer has to do on their orders now (account overview). */
export function orderTasks(orders: Order[]): Task[] {
  return orders.flatMap((o): Task[] => {
    if (o.kind === 'custom' && o.step === 'mockup' && o.mockups[0]?.state === 'waiting')
      return [{ id: o.id, tag: 'Maket', title: `Duyệt maket · Đơn ${o.id} · ${o.vendorName}`, meta: `Gửi lúc ${o.mockups[0].sentAt}`, to: routes.account.order(o.id), action: 'Duyệt', primary: true }];
    if (o.kind === 'custom' && o.step === 'remaining')
      return [{ id: o.id, tag: 'Thanh toán', title: `Trả phần còn lại ${formatVnd(remainingAmount(o))} · Đơn ${o.id}`, meta: 'Đơn vị đã giao xong', to: routes.account.order(o.id), action: 'Thanh toán' }];
    if (o.kind === 'ready' && o.status === 'shipping')
      return [{ id: o.id, tag: 'Nhận hàng', title: `Xác nhận đã nhận · Đơn ${o.id} · ${o.shop}`, meta: o.expectedAt ? `Dự kiến giao ${o.expectedAt}` : 'Đang giao', to: routes.account.order(o.id), action: 'Xem đơn' }];
    return [];
  });
}

export const activeOrderCount = (orders: Order[]) =>
  orders.filter((o) => (o.kind === 'ready' ? o.status === 'pending' || o.status === 'shipping' : o.step !== 'done')).length;
