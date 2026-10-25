export type ApplicationState = 'pending' | 'needs-more' | 'approved' | 'locked' | 'rejected';

export interface SellerApplication {
  id: string;
  /** Account of the applicant (demo: links the decision to the seller channel). */
  account: string;
  shopName: string;
  kind: string;
  city: string;
  ways: string;
  attempt: number;
  submittedAt: string;
  waiting: string;
  regNo: string;
  address: string;
  source: string;
  ownerOnPaper: { name: string; id: string };
  ownerOnChip: { name: string; id: string };
  state: ApplicationState;
  history: { label: string; at: string }[];
}

export interface AdminProduct {
  id: string;
  name: string;
  shop: string;
  price: number;
  removed?: { reason: string; at: string };
}

export interface DisbursementRequest {
  id: string;
  orderId: string;
  seller: string;
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
  seller: string;
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
  sellerFees: number;
  rows: { id: string; kind: string; vnpay: number; system: number }[];
}

export interface Dispute {
  id: string;
  orderId: string;
  openedAt: string;
  buyer: string;
  seller: string;
  reason: string;
  buyerText: string;
  sellerProposal?: { kind: string; amount: number; note: string };
  lines: { name: string; amount: number }[];
  held: number;
  paidOut: number;
  history: { label: string; at: string }[];
  state: 'open' | 'decided' | 'manual';
  decision?: { kind: string; amount: number; note: string; at: string };
}

export interface ProvinceFee {
  province: string;
  fee: number | null;
}

export interface Taxonomy {
  crusts: { name: string; visible: boolean }[];
  fillings: { name: string; visible: boolean }[];
}
