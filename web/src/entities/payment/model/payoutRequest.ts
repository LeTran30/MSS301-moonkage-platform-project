import type { DisbursementDto, LedgerDto } from '../api/ledgerApi';

/**
 * Một lệnh giải ngân của gian hàng (Q4.1).
 *
 * Gom DTO của backend (`DisbursementResponse`) và sổ quỹ (`LedgerResponse`) vào
 * một kiểu mà các màn hình quản trị dùng chung.
 */
export interface PayoutRequest {
  requestId: string;
  orderId: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  purpose: string;
  status: string;
  reason?: string | null;
  createdAt?: string;
  decidedAt?: string | null;
}

/**
 * Mục đích giải ngân (`DisbursementPurpose` của payment-service).
 *
 * Người bán báo cáo mục đích dùng tiền cọc (nguyên liệu, in ấn, bao bì,
 * nhập hàng) — `docs/product/context.md` mục 5.
 */
export const DISBURSEMENT_PURPOSES = ['MATERIALS', 'PRINTING', 'PACKAGING', 'RESTOCK'] as const;

export type DisbursementPurpose = (typeof DISBURSEMENT_PURPOSES)[number];

/** Nhãn tiếng Việt của mục đích giải ngân. */
export function payoutPurposeLabel(purpose: string): string {
  switch (purpose) {
    case 'MATERIALS':
      return 'Nguyên liệu';
    case 'PRINTING':
      return 'In ấn';
    case 'PACKAGING':
      return 'Bao bì';
    case 'RESTOCK':
      return 'Nhập hàng';
    default:
      return purpose;
  }
}

/** Map DTO của backend và sổ quỹ sang lệnh giải ngân cho UI. */
export function toPayoutRequest(
  disbursement: DisbursementDto & { ledger: LedgerDto },
  vendorName = ''
): PayoutRequest {
  return {
    requestId: disbursement.requestId,
    orderId: disbursement.orderId ?? disbursement.ledger.orderId,
    vendorId: disbursement.ledger.vendorId ?? '',
    vendorName,
    amount: disbursement.amount ?? 0,
    purpose: disbursement.purpose ?? 'MATERIALS',
    status: disbursement.status ?? 'PENDING',
    reason: disbursement.reason,
    createdAt: disbursement.createdAt,
    decidedAt: disbursement.decidedAt,
  };
}
