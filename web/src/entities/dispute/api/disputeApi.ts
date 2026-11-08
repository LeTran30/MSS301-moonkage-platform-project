import { apiClient, GATEWAY, unwrap } from '@/shared/api';

import { orderApi } from '@/entities/order/@x/dispute';
import { ledgerApi } from '@/entities/payment/@x/dispute';
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
 * from the payment ledger, not from the dispute itself. The UI therefore reads
 * the escrow amount from `GET /api/ledgers/{orderId}` and only reads
 * `decision` / `refundAmount` back from the dispute.
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

/**
 * Map a backend dispute to the UI entity.
 *
 * `ledger` là sổ tiền của đơn: nó cho biết đang **giữ** bao nhiêu trong
 * Escrow (`held`) và tổng đơn là bao nhiêu (`totalCollected`). Không có nó
 * thì các con số này bằng 0 và quy tắc AC-49.3 không kiểm tra được.
 */
export function mapDisputeDtoToEntity(
  dto: DisputeDto,
  fallbackOrderId?: string,
  ledger?: {
    held?: number;
    totalCollected?: number;
    disbursed?: number;
  } | null,
): Dispute {
  const existing = disputeStore.get().find((d) => d.id === dto.disputeId);
  const evidences: DisputeEvidence[] = (dto.evidences ?? []).map((e) => ({
    party: e.party,
    downloadUrl: e.downloadUrl,
    note: e.note,
    createdAt: e.createdAt,
  }));

  // Số tiền đang giữ: ưu tiên sổ tiền của máy chủ, sau đó tới giá trị đã
  // biết trong phiên, cuối cùng mới là 0 (không phải một con số bịa ra).
  const escrowHoldingAmount = ledger?.held ?? existing?.escrowHoldingAmount ?? 0;
  const orderTotalAmount = ledger?.totalCollected ?? existing?.orderTotalAmount ?? 0;
  const disbursedAmount = ledger?.disbursed ?? existing?.disbursedAmount ?? 0;

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
    orderTotalAmount,
    escrowHoldingAmount,
    disbursedAmount,
    // AC-49.3: tối đa hoàn được = đúng số tiền đang giữ trong Escrow.
    maxRefundableAmount: escrowHoldingAmount,
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
    const orders = await orderApi.getOrders({ openDispute: true });
    const disputes: Dispute[] = [];
    for (const order of orders) {
      const dispute = await disputeApi.getByOrderId(order.id);
      if (dispute) disputes.push(dispute);
    }
    return disputes;
  },

  /**
   * The one dispute of an order (the backend allows only one open dispute per order).
   *
   * Sổ tiền của đơn được đọc kèm: `GET /api/ledgers/{orderId}` cho biết đang
   * giữ bao nhiêu trong Escrow — con số mà AC-49.3 chặn trần hoàn tiền.
   */
  async getByOrderId(orderId: string): Promise<Dispute | null> {
    const res = await apiClient.get<unknown>(GATEWAY.ORDER.DISPUTE(orderId));
    const dto = unwrap<DisputeDto>(res);
    if (!dto) return null;

    // Sổ tiền là dữ liệu bổ sung: đọc song song với hồ sơ khiếu nại và bỏ
    // qua lỗi của nó, vì hồ sơ khiếu nại vẫn dùng được kể cả khi sổ tiền
    // tạm thời không trả lời.
    let ledger = null;
    try {
      ledger = await ledgerApi.getLedger(orderId);
    } catch {
      ledger = null;
    }

    return mapDisputeDtoToEntity(dto, orderId, ledger);
  },
};
