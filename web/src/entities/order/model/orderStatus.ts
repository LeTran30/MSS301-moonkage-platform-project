import type { Order } from './types';

type OrderStatus = Order['status'];

/** What each order status means to the people who read it. */
const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PAID: 'Đã thanh toán',
  CONFIRMED: 'Shop đã xác nhận',
  SHIPPING: 'Đang giao',
  DEPOSITED: 'Đã đặt cọc',
  WAITING_MAKET: 'Chờ duyệt maket',
  IN_PRODUCTION: 'Đang sản xuất',
  READY_TO_SHIP: 'Sẵn sàng giao',
  DELIVERED: 'Đã giao hàng',
  COMPLETED: 'Hoàn tất',
  REJECTED: 'Shop đã từ chối',
};

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

/** The steps an order goes through, in order (BR-25 buy now, FR-40 custom order). */
export function orderStatusSteps(type: Order['type']): OrderStatus[] {
  return type === 'BULK'
    ? ['DEPOSITED', 'WAITING_MAKET', 'IN_PRODUCTION', 'READY_TO_SHIP', 'DELIVERED', 'COMPLETED']
    : ['PAID', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'COMPLETED'];
}
