import { ApiError, apiClient, GATEWAY, unwrap, unwrapPage } from '@/shared/api';

import { ledgerApi } from '@/entities/payment/@x/dispute';
import type {
  Dispute,
  DisputeDecision,
  DisputeParty,
  DisputeReason,
  DisputeStatus,
} from '../model/dispute';

/** Wire shape of `com.moonkage.order.dto.response.DisputeResponse`. */
export interface DisputeDto {
  disputeId: string;
  orderId: string;
  /** The Shop's name on the day of the order; null on older orders. */
  vendorName?: string | null;
  /** Who received the order: the name the buyer gave for it. */
  recipientName?: string | null;
  /** What the buyer paid for the order; a full refund gives it back. */
  orderTotalAmount?: number;
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
 * `held` là số đang giữ trong sổ tiền của đơn (`GET /api/ledgers/{orderId}`):
 * trần hoàn tiền theo AC-49.3. Người mua không đọc được sổ tiền, nên khi không
 * có thì số này là 0 chứ không đoán.
 */
export function mapDisputeDtoToEntity(dto: DisputeDto, held?: number | null): Dispute {
  const escrowHoldingAmount = held ?? 0;
  return {
    id: dto.disputeId,
    orderId: dto.orderId,
    buyerName: dto.recipientName ?? '',
    vendorName: dto.vendorName ?? '',
    reason: dto.reason,
    description: dto.description,
    evidences: (dto.evidences ?? []).map((e) => ({
      party: e.party,
      downloadUrl: e.downloadUrl,
      note: e.note,
      createdAt: e.createdAt,
    })),
    createdAt: dto.createdAt ?? '',
    status: dto.status,
    resolvedAt: dto.resolvedAt ?? undefined,
    orderTotalAmount: dto.orderTotalAmount ?? 0,
    escrowHoldingAmount,
    maxRefundableAmount: escrowHoldingAmount,
    decision: dto.decision ?? undefined,
    refundAmount: dto.refundAmount ?? undefined,
    adminNote: dto.decisionReason ?? undefined,
  };
}

/** Số đang giữ của đơn; sổ tiền là dữ liệu bổ sung nên lỗi của nó không làm hỏng hồ sơ. */
async function heldOf(orderId: string): Promise<number | null> {
  try {
    const ledger = await ledgerApi.getLedger(orderId);
    return ledger?.held ?? null;
  } catch {
    return null;
  }
}

/**
 * The read side of the disputes (FR-12, FR-49, Q5.0).
 *
 * The writes (`openDispute`, `addDisputeEvidence`, `resolveDispute`) belong to
 * the `file-complaint` and `resolve-disputes` features
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */
export const disputeApi = {
  /**
   * The admin's queue (FR-49, Q5.0): `GET /api/orders/disputes?status=`.
   *
   * Open ones come oldest first, each with the amount its order still holds;
   * decided ones latest decision first (their ledger is no longer needed).
   */
  async list(status: DisputeStatus): Promise<Dispute[]> {
    const params = new URLSearchParams({ status, size: '100' });
    const res = await apiClient.get<unknown>(`${GATEWAY.ORDER.DISPUTES}?${params.toString()}`);
    const dtos = unwrapPage<DisputeDto>(res);
    if (status === 'RESOLVED') {
      return dtos.map((dto) => mapDisputeDtoToEntity(dto));
    }
    return Promise.all(
      dtos.map(async (dto) => mapDisputeDtoToEntity(dto, await heldOf(dto.orderId))),
    );
  },

  /**
   * The latest dispute of an order, or `null` when the order never had one.
   *
   * Sổ tiền của đơn được đọc kèm khi người xem có quyền (Shop, quản trị viên).
   */
  async getByOrderId(orderId: string): Promise<Dispute | null> {
    let res;
    try {
      res = await apiClient.get<unknown>(GATEWAY.ORDER.DISPUTE(orderId));
    } catch (error) {
      // 404 DISPUTE_001: đơn chưa từng bị khiếu nại — không phải lỗi của màn hình.
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
    const dto = unwrap<DisputeDto>(res);
    if (!dto) return null;
    return mapDisputeDtoToEntity(dto, await heldOf(orderId));
  },
};
