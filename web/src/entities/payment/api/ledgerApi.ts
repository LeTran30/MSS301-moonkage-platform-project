import { apiClient, GATEWAY, unwrap, unwrapList, unwrapPage } from '@/shared/api';
import { isDemoMode } from '@/shared/config';

/**
 * Wire shape of `com.moonkage.payment.dto.response.LedgerResponse`
 * (FR-43, AC-43.1): the money of one order.
 *
 * `toReceive` is what the vendor will get from what the platform holds; the
 * backend charges no commission (BR-10).
 */
export interface LedgerDto {
  orderId: string;
  vendorId?: string;
  /** BUY_NOW or CUSTOM_ORDER; null until order-service's events arrived. */
  kind?: 'BUY_NOW' | 'CUSTOM_ORDER' | null;
  orderStatus?: string;
  totalCollected?: number;
  held?: number;
  disbursed?: number;
  refunded?: number;
  paidOut?: number;
  toReceive?: number;
  expectedPayoutDate?: string | null;
  disputeOpen?: boolean;
  /** Looks eligible for payout and not paid out yet (AC-48.1). */
  payable?: boolean;
}

/** Wire shape of `com.moonkage.payment.dto.response.LedgerEntryResponse`. */
export interface LedgerEntryDto {
  kind?: string;
  amount?: number;
  referenceId?: string;
  actorAccountId?: string;
  createdAt?: string;
}

/** Wire shape of `com.moonkage.payment.dto.response.DisbursementResponse`. */
export interface DisbursementDto {
  requestId: string;
  orderId?: string;
  amount?: number;
  approvedAmount?: number | null;
  purpose?: string;
  status?: string;
  reason?: string | null;
  createdAt?: string;
  decidedAt?: string | null;
}

/** Wire shape of `com.moonkage.payment.dto.request.CreateDisbursementRequest`. */
export interface CreateDisbursementPayload {
  amount: number;
  /** `DisbursementPurpose`: MATERIALS, PRINTING, PACKAGING hoặc RESTOCK. */
  purpose: 'MATERIALS' | 'PRINTING' | 'PACKAGING' | 'RESTOCK';
}

/** Wire shape of `com.moonkage.payment.dto.response.RefundResponse`. */
export interface RefundDto {
  refundId?: string;
  orderId?: string;
  amount?: number;
  reason?: string | null;
  status?: string;
  createdAt?: string;
}

/** Wire shape of `com.moonkage.payment.dto.response.PayoutResponse` (FR-48). */
export interface PayoutDto {
  orderId?: string;
  amount?: number;
  paidAt?: string | null;
  reference?: string | null;
}

/**
 * The vendor's reconciliation (FR-43) and the escrow disbursements (FR-41).
 *
 * `GET /api/ledgers?vendorId=...` — the vendor owner's own ledgers;
 * `payableOnly=true` for the orders waiting for the payout (AC-48.1).
 */
export const ledgerApi = {
  async getLedgers(options?: {
    vendorId?: string;
    payableOnly?: boolean;
  }): Promise<LedgerDto[]> {
    if (isDemoMode()) {
      return [];
    }
    const params = new URLSearchParams();
    if (options?.vendorId) params.set('vendorId', options.vendorId);
    if (options?.payableOnly) params.set('payableOnly', 'true');
    params.set('size', '200');

    const query = params.toString();
    const res = await apiClient.get<unknown>(
      query ? `${GATEWAY.PAYMENT.LEDGERS}?${query}` : GATEWAY.PAYMENT.LEDGERS
    );
    return unwrapPage<LedgerDto>(res);
  },

  /** The money of one order. */
  async getLedger(orderId: string): Promise<LedgerDto | null> {
    if (isDemoMode()) {
      return null;
    }
    const res = await apiClient.get<unknown>(GATEWAY.PAYMENT.LEDGER_BY_ORDER(orderId));
    return unwrap<LedgerDto>(res);
  },

  /** The order's money journal (NFR-07), read only. */
  async getEntries(orderId: string): Promise<LedgerEntryDto[]> {
    if (isDemoMode()) {
      return [];
    }
    const res = await apiClient.get<unknown>(GATEWAY.PAYMENT.LEDGER_ENTRIES(orderId));
    return unwrapList<LedgerEntryDto>(res);
  },

  /** The refunds booked on the order (FR-49). */
  async getRefunds(orderId: string): Promise<RefundDto[]> {
    if (isDemoMode()) {
      return [];
    }
    const res = await apiClient.get<unknown>(GATEWAY.PAYMENT.LEDGER_REFUNDS(orderId));
    return unwrapList<RefundDto>(res);
  },

  /** The disbursement requests booked on the order. */
  async getDisbursements(orderId: string): Promise<DisbursementDto[]> {
    if (isDemoMode()) {
      return [];
    }
    const res = await apiClient.get<unknown>(GATEWAY.PAYMENT.LEDGER_DISBURSEMENTS(orderId));
    return unwrapList<DisbursementDto>(res);
  },
};
