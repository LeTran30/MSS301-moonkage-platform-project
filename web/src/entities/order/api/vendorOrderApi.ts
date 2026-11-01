import { mockResponse, seedStore } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import type { VendorCustomOrder, VendorCustomStep, VendorOrder, VendorOrderStatus } from '../model/vendorOrderTypes';
import { customStepOf } from './orderApi';
import {
  dateOf,
  deliverToOf,
  depositPercentOf,
  fetchMyVendorId,
  fetchOrderBundle,
  fetchOrderBundles,
  historyOf,
  linesOf,
  newestFirst,
  titleOf,
  type OrderBundle,
  type OrderStatusDto,
} from './orderDto';
import { seedVendorOrders } from './vendorOrderSeed';

/** The shop's orders in demo mode, kept in the demo store. */
export const vendorOrderStore = seedStore('vendor-orders', seedVendorOrders);

const vendorStatusOf: Partial<Record<OrderStatusDto, VendorOrderStatus>> = {
  PAID: 'new',
  CONFIRMED: 'confirmed',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  COMPLETED: 'delivered',
};

function toVendorOrder({ order: o, progress, mockups }: OrderBundle): VendorOrder {
  if (o.kind === 'BUY_NOW') {
    return {
      kind: 'ready',
      id: o.id,
      placedAt: dateOf(o.createdAt) ?? '',
      buyer: o.recipientName,
      deliverTo: deliverToOf(o),
      interProvince: o.interprovince,
      lines: linesOf(o),
      shippingFee: o.shippingFee,
      status: vendorStatusOf[o.status] ?? 'new',
      tracking: o.trackingCode ?? undefined,
      deliveredAt: dateOf(o.deliveredAt),
      invoiceAttached: o.hasInvoiceFile,
      history: historyOf(progress).reverse(),
    };
  }
  const latest = newestFirst(mockups)[0];
  const step = (customStepOf[o.status] ?? 'mockup') as VendorCustomStep;
  const custom: VendorCustomOrder = {
    kind: 'custom',
    id: o.id,
    buyer: o.invoiceInfo?.name ?? o.recipientName,
    title: titleOf(o),
    deliverBy: dateOf(o.deliveryDate) ?? '',
    value: o.totalAmount,
    depositPercent: depositPercentOf(o),
    step,
    feedback:
      latest?.reviewStatus === 'CHANGES_REQUESTED' ? { text: latest.reviewNote ?? '', at: dateOf(latest.reviewedAt) ?? '' } : undefined,
    mockupsSent: mockups.length,
    latestMockupUrl: latest?.downloadUrl,
    mockupApproved: mockups.some((m) => m.reviewStatus === 'APPROVED'),
    progress: historyOf(progress),
    held: null,
    disbursed: null,
    invoiceAttached: o.hasInvoiceFile,
  };
  return custom;
}

/** FR-32: the orders of the caller's Shop. */
export async function fetchVendorOrders(): Promise<VendorOrder[]> {
  if (config.demoMode) return mockResponse(vendorOrderStore.get());
  const vendorId = await fetchMyVendorId();
  if (!vendorId) return [];
  return (await fetchOrderBundles({ vendorId })).map(toVendorOrder);
}

export async function fetchVendorOrder(id: string): Promise<VendorOrder | null> {
  if (config.demoMode) return mockResponse(vendorOrderStore.get().find((o) => o.id === id) ?? null);
  const bundle = await fetchOrderBundle(id);
  return bundle && toVendorOrder(bundle);
}
