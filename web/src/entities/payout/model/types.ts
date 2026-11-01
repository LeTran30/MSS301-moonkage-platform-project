export interface Settlement {
  orderId: string;
  deliveredAt: string;
  goods: number;
  shipping: number;
  state: string;
}

export interface Disbursement {
  orderId: string;
  milestone: string;
  amount: number | null;
  heldAfter: number;
  state: string;
}

export interface DisbursementRequest {
  id: string;
  orderId: string;
  vendor: string;
  askedAt: string;
  milestone: string;
  amount: number;
  heldNow: number;
  disbursedBefore: number;
  state: 'waiting' | 'approved' | 'refused';
  refusal?: string;
}

export interface Payout {
  orderId: string;
  vendor: string;
  complaintEnds: string;
  amount: number;
  blocked?: string;
  paid?: boolean;
}

/** B5.0: what Moonkage holds for the Shop, what it will still pay, what the Shop already got. */
export interface VendorMoneySummary {
  held: number;
  toReceive: number;
  received: number;
}

export interface Reconciliation {
  month: string;
  vnpay: number;
  held: number;
  paidOut: number;
  vendorFees: number;
  rows: { id: string; kind: string; vnpay: number; system: number }[];
}
