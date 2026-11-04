import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import { orderApi } from '@/entities/order/@x/dispute';
import {
  disputeStore,
  type Dispute,
  type DisputeDecision,
  type DisputeEvidence,
  type DisputeParty,
  type DisputeReason,
  type DisputeStatus,
} from '../model/disputeStore';

/**
 * Wire shape of `com.moonkage.order.dto.response.DisputeResponse`.
 *
 * The backend names the money of a dispute nowhere: the refundable amount comes
 * from the payment ledger, not from the dispute itself. The UI therefore keeps
 * its escrow amounts locally and only reads `decision` / `refundAmount` back.
 */
export interface DisputeDto {
  disputeId: string;
  orderId: string;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  decision?: DisputeDecision | null;
  refundAmount?: number | null;
  decisionReason?: string | null;
  createdAt?: string;
  resolvedAt?: string | null;
  evidences?: Array<{
    party: DisputeParty;
    downloadUrl: string;
    note?: string;
    createdAt?: string;
  }>;
}

/** Map a backend dispute to the UI entity. */
export function mapDisputeDtoToEntity(dto: DisputeDto, fallbackOrderId?: string): Dispute {
  const existing = disputeStore.get().find((d) => d.id === dto.disputeId);
  const evidences: DisputeEvidence[] = (dto.evidences ?? []).map((e) => ({
    party: e.party,
    downloadUrl: e.downloadUrl,
    note: e.note,
    createdAt: e.createdAt,
  }));

  return {
    id: dto.disputeId,
    orderId: dto.orderId || fallbackOrderId || '',
    buyerId: existing?.buyerId ?? '',
    buyerName: existing?.buyerName ?? '',
    vendorId: existing?.vendorId ?? '',
    vendorName: existing?.vendorName ?? '',
    reason: dto.reason,
    description: dto.description,
    images: evidences.map((e) => e.downloadUrl),
    evidences,
    createdAt: dto.createdAt ?? new Date().toISOString(),
    status: dto.status,
    resolvedAt: dto.resolvedAt ?? undefined,
    orderTotalAmount: existing?.orderTotalAmount ?? 0,
    escrowHoldingAmount: existing?.escrowHoldingAmount ?? 0,
    disbursedAmount: existing?.disbursedAmount ?? 0,
    maxRefundableAmount: existing?.maxRefundableAmount ?? 0,
    decision: dto.decision ?? undefined,
    refundAmount: dto.refundAmount ?? undefined,
    adminNote: dto.decisionReason ?? existing?.adminNote,
    decidedAt: dto.resolvedAt ?? existing?.decidedAt,
  };
}

/**
 * The read side of the disputes (FR-49, Q5.0).
 *
 * The writes (`openDispute`, `addDisputeEvidence`, `resolveDispute`) belong to
 * the `file-complaint` and `resolve-disputes` features
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */
export const disputeApi = {
  /**
   * The open disputes of the platform (FR-49, Q5.0).
   *
   * `GET /api/orders?disputeStatus=OPEN` lists the orders waiting for a
   * decision; `GET /api/orders/{orderId}/dispute` reads the dispute of each.
   */
  async listOpen(): Promise<Dispute[]> {
    if (isDemoMode()) {
      return disputeStore.get().filter((d) => d.status === 'OPEN');
    }
    const orders = await orderApi.getOrders({ openDispute: true });
    const disputes: Dispute[] = [];
    for (const order of orders) {
      const dispute = await disputeApi.getByOrderId(order.id);
      if (dispute) disputes.push(dispute);
    }
    return disputes;
  },

  /** The one dispute of an order (the backend allows only one open dispute per order). */
  async getByOrderId(orderId: string): Promise<Dispute | null> {
    if (isDemoMode()) {
      return disputeStore.get().find((d) => d.orderId === orderId) ?? null;
    }
    const res = await apiClient.get<unknown>(GATEWAY.ORDER.DISPUTE(orderId));
    const dto = unwrap<DisputeDto>(res);
    return dto ? mapDisputeDtoToEntity(dto, orderId) : null;
  },
};
