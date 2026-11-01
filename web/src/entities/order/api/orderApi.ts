import { mockResponse, seedStore } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { provinceNameOf } from '@/shared/config/provinces';
import type { Complaint, CustomOrder, CustomStep, Mockup, Order, ReadyOrder, ReadyStatus } from '../model/types';
import {
  complaintDaysOf,
  dateOf,
  depositPercentOf,
  fetchOrderBundle,
  fetchOrderBundles,
  fetchVendorNames,
  historyOf,
  linesOf,
  newestFirst,
  titleOf,
  type MockupReviewStatusDto,
  type OrderBundle,
  type OrderStatusDto,
} from './orderDto';
import { seedComplaints, seedOrders } from './seed';

/** Demo mode answers from the seed (seed.ts); changes are kept in the demo store. */
export const orderStore = seedStore<Order[]>('buyer-orders', seedOrders);
export const complaintStore = seedStore<Complaint[]>('buyer-complaints', seedComplaints);

const readyStatusOf: Partial<Record<OrderStatusDto, ReadyStatus>> = {
  PAID: 'pending',
  CONFIRMED: 'pending',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  COMPLETED: 'delivered',
};

/** DEPOSITED waits for the first mockup; DELIVERED for the rest of the money (FR-22). */
export const customStepOf: Partial<Record<OrderStatusDto, CustomStep>> = {
  DEPOSITED: 'mockup',
  AWAITING_MOCKUP_APPROVAL: 'mockup',
  IN_PRODUCTION: 'production',
  READY_TO_SHIP: 'delivery',
  DELIVERED: 'remaining',
  COMPLETED: 'done',
};

const mockupStateOf: Record<MockupReviewStatusDto, Mockup['state']> = {
  PENDING_REVIEW: 'waiting',
  CHANGES_REQUESTED: 'revise',
  APPROVED: 'approved',
};

function toBuyerOrder({ order: o, progress, mockups }: OrderBundle, shopName: string): Order {
  if (o.kind === 'BUY_NOW') {
    const ready: ReadyOrder = {
      kind: 'ready',
      id: o.id,
      shop: shopName,
      paymentId: o.paymentGroupId ?? o.id,
      placedAt: dateOf(o.createdAt) ?? '',
      lines: linesOf(o),
      shippingFee: o.shippingFee,
      status: readyStatusOf[o.status] ?? 'pending',
      tracking: o.trackingCode ?? undefined,
      expectedAt: dateOf(o.deliveryDate),
      deliveredAt: dateOf(o.deliveredAt),
      receivedConfirmed: o.receivedConfirmedAt !== null,
      address: { name: o.recipientName, phone: o.recipientPhone, line: `${o.addressDetail}, ${provinceNameOf(o.provinceCode)}` },
      invoice: o.invoiceInfo ? { company: o.invoiceInfo.name, taxCode: o.invoiceInfo.taxCode, email: o.invoiceInfo.email } : undefined,
      invoiceAttached: o.hasInvoiceFile,
      history: historyOf(progress).reverse(),
      complaintDays: complaintDaysOf(o),
    };
    return ready;
  }
  const custom: CustomOrder = {
    kind: 'custom',
    id: o.id,
    vendorName: shopName,
    title: titleOf(o),
    value: o.totalAmount,
    depositPercent: depositPercentOf(o),
    depositPaidAt: dateOf(o.createdAt) ?? '',
    step: customStepOf[o.status] ?? 'mockup',
    mockups: newestFirst(mockups).map((m) => ({
      version: m.versionNo,
      sentAt: dateOf(m.uploadedAt) ?? '',
      note: '',
      state: mockupStateOf[m.reviewStatus],
      feedback: m.reviewNote ?? undefined,
      fileUrl: m.downloadUrl,
    })),
    progress: historyOf(progress),
    deliveredAt: dateOf(o.deliveredAt),
    invoiceAttached: o.hasInvoiceFile,
  };
  return custom;
}

async function toBuyerOrders(bundles: OrderBundle[]): Promise<Order[]> {
  const names = await fetchVendorNames();
  return bundles.map((b) => toBuyerOrder(b, names.get(b.order.vendorId) ?? b.order.vendorId));
}

/** The caller's own purchases (FR-10). */
export async function fetchOrders(): Promise<Order[]> {
  if (config.demoMode) return mockResponse(orderStore.get());
  return toBuyerOrders(await fetchOrderBundles());
}

export async function fetchOrder(orderId: string): Promise<Order | null> {
  if (config.demoMode) return mockResponse(orderStore.get().find((o) => o.id === orderId) ?? null);
  const bundle = await fetchOrderBundle(orderId);
  if (!bundle) return null;
  const [order] = await toBuyerOrders([bundle]);
  return order;
}

/** Disputes are not wired to order-service yet: only the demo has complaints. */
export function fetchComplaintOfOrder(orderId: string): Promise<Complaint | null> {
  return mockResponse(config.demoMode ? (complaintStore.get().find((c) => c.orderId === orderId) ?? null) : null);
}
