import { ApiError, apiClient, type ApiResponse } from '@/shared/api/client';
import { ledgersPath, ordersPath } from '@/shared/api/gateway';
import { HTTP_NOT_FOUND } from '@/shared/api/httpStatus';
import { mockResponse, seedStore } from '@/shared/api/mock';
import { fetchVendorNames } from '@/shared/api/vendors';
import { disputeDecisionLabel, disputeReasonLabel } from '@/shared/config/disputes';
import { config } from '@/shared/config/env';
import { formatDate } from '@/shared/utils/format';
import type { Dispute } from '../model/types';
import { seedDisputes } from './seed';

/** Demo mode: complaints a buyer escalated, decided by an admin (Q5). */
export const disputeStore = seedStore('admin-disputes', seedDisputes);

/** order-service `DisputeResponse`. */
interface DisputeDto {
  disputeId: string;
  orderId: string;
  reason: string;
  description: string;
  status: 'OPEN' | 'RESOLVED';
  decision: string | null;
  refundAmount: number | null;
  decisionReason: string | null;
  createdAt: string;
  resolvedAt: string | null;
  evidences: { party: 'BUYER' | 'VENDOR'; downloadUrl: string; note: string | null; createdAt: string }[];
}

/** order-service `OrderResponse`, the fields the decision shows. */
interface DisputedOrderDto {
  id: string;
  vendorId: string;
  recipientName: string;
  shippingFee: number;
  items: { productName: string; quantity: number; subtotal: number }[];
}

/** payment-service `LedgerResponse`, what the platform holds for the order. */
interface LedgerMoneyDto {
  held: number;
  paidOut: number;
}

/** Far above the open disputes of the pilot; the list has no paging UI. */
const PAGE_SIZE = 100;

const orderPath = (orderId: string) => `${ordersPath}/${encodeURIComponent(orderId)}`;

const get = <T>(url: string) => apiClient.get<ApiResponse<T>>(url).then((r) => r.data.data);

function toDispute(d: DisputeDto, o: DisputedOrderDto, money: LedgerMoneyDto, vendorName: string): Dispute {
  const vendorEvidences = d.evidences.filter((e) => e.party === 'VENDOR');
  return {
    id: d.disputeId,
    orderId: d.orderId,
    openedAt: formatDate(d.createdAt),
    buyer: o.recipientName,
    vendor: vendorName,
    reason: disputeReasonLabel(d.reason),
    buyerText: d.description,
    buyerPhotoUrls: d.evidences.filter((e) => e.party === 'BUYER').map((e) => e.downloadUrl),
    vendorReplies: vendorEvidences.map((e) => ({ note: e.note ?? '', fileUrl: e.downloadUrl, at: formatDate(e.createdAt) })),
    lines: [...o.items.map((i) => ({ name: `${i.productName} × ${i.quantity}`, amount: i.subtotal })), { name: 'Phí giao', amount: o.shippingFee }],
    held: money.held,
    paidOut: money.paidOut,
    history: [
      ...(d.resolvedAt ? [{ label: 'Quản trị quyết định', at: formatDate(d.resolvedAt) }] : []),
      ...vendorEvidences.map((e) => ({ label: 'Người bán phản hồi', at: formatDate(e.createdAt) })).reverse(),
      { label: 'Người mua báo vấn đề · tiền bị giữ', at: formatDate(d.createdAt) },
    ],
    state: d.status === 'OPEN' ? 'open' : 'decided',
    decision:
      d.status === 'RESOLVED' && d.decision
        ? { kind: disputeDecisionLabel(d.decision), amount: d.refundAmount ?? 0, note: d.decisionReason ?? '', at: formatDate(d.resolvedAt) }
        : undefined,
  };
}

async function fetchOne(orderId: string, names: Map<string, string>): Promise<Dispute | null> {
  let dispute: DisputeDto;
  try {
    dispute = await get<DisputeDto>(`${orderPath(orderId)}/dispute`);
  } catch (e) {
    if (e instanceof ApiError && e.status === HTTP_NOT_FOUND) return null;
    throw e;
  }
  const [order, money] = await Promise.all([
    get<DisputedOrderDto>(orderPath(orderId)),
    get<LedgerMoneyDto>(`${ledgersPath}/${encodeURIComponent(orderId)}`),
  ]);
  return toDispute(dispute, order, money, names.get(order.vendorId) ?? order.vendorId);
}

/** FR-49, admin: the orders waiting for a dispute decision. Decided disputes are not listed by the server. */
export async function fetchDisputes(): Promise<Dispute[]> {
  if (config.demoMode) return mockResponse(disputeStore.get());
  const [open, names] = await Promise.all([
    get<{ content: { id: string }[] }>(`${ordersPath}?disputeStatus=OPEN&size=${PAGE_SIZE}`),
    fetchVendorNames(),
  ]);
  const disputes = await Promise.all((open.content ?? []).map((o) => fetchOne(o.id, names)));
  return disputes.filter((d): d is Dispute => d !== null);
}

/** The dispute of one order (the admin route names the order: the server reads a dispute by its order). */
export async function fetchDispute(orderId: string): Promise<Dispute | null> {
  if (config.demoMode) return mockResponse(disputeStore.get().find((d) => d.orderId === orderId) ?? null);
  return fetchOne(orderId, await fetchVendorNames());
}
