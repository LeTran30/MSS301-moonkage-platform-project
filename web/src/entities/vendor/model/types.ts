/** Vendor profile state: submitted → approved (fee due) → open; or sent back for more documents. */
export type VendorState = 'pending' | 'needs-more' | 'approved' | 'open' | 'rejected';

export interface VendorProfile {
  state: VendorState;
  shopName: string;
  kind: string;
  regNo: string;
  address: string;
  ownerName: string;
  ownerId: string;
  submittedAt: string;
  approvedAt?: string;
  /** What the admin asked for when sending it back, or why it was refused. */
  moreNeeded?: string;
  ways: { shop: boolean; custom: boolean };
}

export interface CustomTerms {
  minBoxes: number;
  mockupHours: number;
  crusts: string[];
  fillings: string[];
  custom: string[];
  tiers: { from: number; to: number | null; price: number }[];
}
