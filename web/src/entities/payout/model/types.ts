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

export interface Reconciliation {
  month: string;
  vnpay: number;
  held: number;
  paidOut: number;
  vendorFees: number;
  rows: { id: string; kind: string; vnpay: number; system: number }[];
}
