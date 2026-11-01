import { apiClient, type ApiResponse } from '@/shared/api/client';
import { ledgersPath } from '@/shared/api/gateway';
import { mockResponse, seedStore } from '@/shared/api/mock';
import { fetchMyVendorId } from '@/shared/api/vendors';
import { disputeReasonLabel } from '@/shared/config/disputes';
import { config } from '@/shared/config/env';
import type { VendorCustomOrder, VendorCustomStep, VendorOrder, VendorOrderStatus, VendorReadyOrder } from '../model/vendorOrderTypes';
import { customStepOf } from './orderApi';
import {
  dateOf,
  deliverToOf,
  depositPercentOf,
  fetchDispute,
  fetchOpenDisputeOrderIds,
  fetchOrderBundle,
  fetchOrderBundles,
  type DisputeDto,
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

/** The buyer's open complaint as the shop sees it, with what the shop already answered. */
function complaintOf(d: DisputeDto): VendorReadyOrder['complaint'] {
  return {
    reason: disputeReasonLabel(d.reason),
    description: d.description,
    photoUrls: d.evidences.filter((e) => e.party === 'BUYER').map((e) => e.downloadUrl),
    replies: d.evidences.filter((e) => e.party === 'VENDOR').map((e) => ({ note: e.note ?? '', at: dateOf(e.createdAt) ?? '' })),
  };
}

function withComplaint(order: VendorOrder, dispute: DisputeDto | null): VendorOrder {
  return order.kind === 'ready' && dispute?.status === 'OPEN' ? { ...order, complaint: complaintOf(dispute) } : order;
}

/** FR-32: the orders of the caller's Shop; the disputes are read only for the orders that have one open. */
export async function fetchVendorOrders(): Promise<VendorOrder[]> {
  if (config.demoMode) return mockResponse(vendorOrderStore.get());
  const vendorId = await fetchMyVendorId();
  if (!vendorId) return [];
  const [bundles, disputed] = await Promise.all([fetchOrderBundles({ vendorId }), fetchOpenDisputeOrderIds({ vendorId })]);
  return Promise.all(
    bundles.map(async (b) => withComplaint(toVendorOrder(b), disputed.has(b.order.id) ? await fetchDispute(b.order.id) : null)),
  );
}

/** payment-service `LedgerResponse`: the deposit held and released for a custom order (FR-43). */
async function fetchDepositMoney(orderId: string): Promise<{ held: number; disbursed: number } | null> {
  try {
    const res = await apiClient.get<ApiResponse<{ held: number; disbursed: number }>>(`${ledgersPath}/${encodeURIComponent(orderId)}`);
    return res.data.data;
  } catch {
    // no ledger yet (payment events not arrived): the view shows the amounts as unknown
    return null;
  }
}

export async function fetchVendorOrder(id: string): Promise<VendorOrder | null> {
  if (config.demoMode) return mockResponse(vendorOrderStore.get().find((o) => o.id === id) ?? null);
  const [bundle, dispute] = await Promise.all([fetchOrderBundle(id), fetchDispute(id)]);
  if (!bundle) return null;
  const order = withComplaint(toVendorOrder(bundle), dispute);
  if (order.kind !== 'custom') return order;
  const money = await fetchDepositMoney(id);
  return money ? { ...order, held: money.held, disbursed: money.disbursed } : order;
}
