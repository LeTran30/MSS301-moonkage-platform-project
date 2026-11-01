export type VendorOrderStatus = 'new' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';

export interface VendorReadyOrder {
  kind: 'ready';
  id: string;
  placedAt: string;
  buyer: string;
  deliverTo: string;
  interProvince: boolean;
  lines: { name: string; price: number; quantity: number }[];
  shippingFee: number;
  status: VendorOrderStatus;
  tracking?: string;
  deliveredAt?: string;
  invoiceAttached: boolean;
  history: { label: string; at: string }[];
  complaint?: {
    reason: string;
    description: string;
    /** Days left to answer; the server sets no deadline for the vendor's answer. */
    daysLeft?: number;
    /** Short-lived links to the buyer's photos; none in the demo. */
    photoUrls?: string[];
    /** The demo's structured proposal; on the server the vendor answers with evidence and a note. */
    proposal?: { kind: string; amount: number; note: string };
    replies?: { note: string; at: string }[];
  };
}

export type VendorCustomStep = 'mockup' | 'production' | 'delivery' | 'remaining' | 'done';

export interface VendorCustomOrder {
  kind: 'custom';
  id: string;
  buyer: string;
  title: string;
  deliverBy: string;
  value: number;
  depositPercent: number;
  step: VendorCustomStep;
  feedback?: { text: string; at: string };
  mockupsSent: number;
  /** Short-lived link to the newest mockup; none in the demo. */
  latestMockupUrl?: string;
  /** Production may start (BR-15); the demo seed does not say. */
  mockupApproved?: boolean;
  progress: { label: string; at: string }[];
  /** Deposit Moonkage holds and has released; null when unknown (the list does not read the ledger). */
  held: number | null;
  disbursed: number | null;
  invoiceAttached: boolean;
}

export type VendorOrder = VendorReadyOrder | VendorCustomOrder;
