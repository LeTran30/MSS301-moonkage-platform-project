import { apiClient, GATEWAY, unwrap, unwrapList, unwrapPage } from '@/shared/api';

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
  /** Total successfully collected with payment purpose DEPOSIT. */
  depositCollected?: number;
  held?: number;
  disbursed?: number;
  refunded?: number;
  paidOut?: number;
  toReceive?: number;
  pendingDisbursement?: number;
  /** Deposit still available for a new disbursement request, after pending requests. */
  remainingDisbursable?: number;
  expectedPayoutDate?: string | null;
  disputeOpen?: boolean;
  disbursementEligible?: boolean;
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

/** Paged admin/vendor row returned by GET /api/ledgers/disbursements. */
export interface DisbursementListItemDto extends DisbursementDto {
  vendorId?: string;
  ledger: LedgerDto;
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
  payoutId?: string;
  orderId?: string;
  vendorId?: string;
  amount?: number;
  createdAt?: string | null;
}

/**
 * The vendor's reconciliation (FR-43) and the escrow disbursements (FR-41).
 *
 * `GET /api/ledgers?vendorId=...` — the vendor owner's own ledgers;
 * `payableOnly=true` for the orders waiting for the payout (AC-48.1).
 */
export const ledgerApi = {
  async getLedgers(options?: { vendorId?: string; payableOnly?: boolean }): Promise<LedgerDto[]> {
    const ledgers: LedgerDto[] = [];
    const pageSize = 100; // payment-service caps every page at 100.
    for (let page = 0; ; page += 1) {
      const params = new URLSearchParams();
      if (options?.vendorId) params.set('vendorId', options.vendorId);
      if (options?.payableOnly) params.set('payableOnly', 'true');
      params.set('page', String(page));
      params.set('size', String(pageSize));
      const res = await apiClient.get<unknown>(`${GATEWAY.PAYMENT.LEDGERS}?${params}`);
      const batch = unwrapPage<LedgerDto>(res);
      ledgers.push(...batch);
      if (batch.length < pageSize) break;
    }
    return ledgers;
  },

  /** The money of one order. */
  async getLedger(orderId: string): Promise<LedgerDto | null> {
    const res = await apiClient.get<unknown>(GATEWAY.PAYMENT.LEDGER_BY_ORDER(orderId));
    return unwrap<LedgerDto>(res);
  },

  /** The order's money journal (NFR-07), read only. */
  async getEntries(orderId: string): Promise<LedgerEntryDto[]> {
    const res = await apiClient.get<unknown>(GATEWAY.PAYMENT.LEDGER_ENTRIES(orderId));
    return unwrapList<LedgerEntryDto>(res);
  },

  /** The refunds booked on the order (FR-49). */
  async getRefunds(orderId: string): Promise<RefundDto[]> {
    const res = await apiClient.get<unknown>(GATEWAY.PAYMENT.LEDGER_REFUNDS(orderId));
    return unwrapList<RefundDto>(res);
  },

  /** The disbursement requests booked on the order. */
  async getDisbursements(orderId: string): Promise<DisbursementDto[]> {
    const res = await apiClient.get<unknown>(GATEWAY.PAYMENT.LEDGER_DISBURSEMENTS(orderId));
    return unwrapList<DisbursementDto>(res);
  },

  /** Direct request page; replaces the former one-request-per-ledger fan-out. */
  async getDisbursementRequests(options?: {
    vendorId?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<DisbursementListItemDto[]> {
    const params = new URLSearchParams();
    if (options?.vendorId) params.set('vendorId', options.vendorId);
    if (options?.status) params.set('status', options.status);
    params.set('page', String(options?.page ?? 0));
    params.set('size', String(options?.size ?? 100));
    const res = await apiClient.get<unknown>(`${GATEWAY.PAYMENT.DISBURSEMENTS}?${params}`);
    return unwrapPage<DisbursementListItemDto>(res);
  },
};
