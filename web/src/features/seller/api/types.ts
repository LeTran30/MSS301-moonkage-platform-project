/** Seller profile state: submitted → approved (fee due) → open; or sent back for more documents. */
export type SellerState = 'pending' | 'needs-more' | 'approved' | 'open' | 'rejected';

export interface SellerProfile {
  state: SellerState;
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

export type SellerOrderStatus = 'new' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';

export interface SellerReadyOrder {
  kind: 'ready';
  id: string;
  placedAt: string;
  buyer: string;
  deliverTo: string;
  interProvince: boolean;
  lines: { name: string; price: number; quantity: number }[];
  shippingFee: number;
  status: SellerOrderStatus;
  tracking?: string;
  deliveredAt?: string;
  invoiceAttached: boolean;
  history: { label: string; at: string }[];
  complaint?: {
    reason: string;
    description: string;
    daysLeft: number;
    proposal?: { kind: string; amount: number; note: string };
  };
}

export type SellerCustomStep = 'mockup' | 'production' | 'delivery' | 'remaining' | 'done';

export interface SellerCustomOrder {
  kind: 'custom';
  id: string;
  buyer: string;
  title: string;
  deliverBy: string;
  value: number;
  depositPercent: number;
  step: SellerCustomStep;
  feedback?: { text: string; at: string };
  mockupsSent: number;
  progress: { label: string; at: string }[];
  held: number;
  disbursed: number;
  invoiceAttached: boolean;
}

export type SellerOrder = SellerReadyOrder | SellerCustomOrder;

export interface IncomingRequest {
  id: string;
  boxes: number;
  perBox: string;
  summary: string;
  invitation: 'open' | 'direct';
  buyer: string;
  buyerVerified: boolean;
  deliverTo: string;
  deliverBy: string;
  hoursLeft: number;
  note?: string;
  files: string[];
  state: 'new' | 'quoted' | 'declined' | 'closed';
  quote?: { unitPrice: number; depositPercent: number; deliverBy: string; validUntil: string; note: string };
}

export interface SellerProduct {
  id: string;
  name: string;
  crusts: string[];
  fillings: string[];
  price: number;
  stock: number;
  visible: boolean;
  /** Taken down by an admin: read-only, with the reason. */
  removed?: { at: string; reason: string };
}

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

export interface DeliveryZones {
  homeProvince: string;
  homeAll: boolean;
  homeFee: number;
  interProvince: boolean;
}

export interface CustomTerms {
  minBoxes: number;
  mockupHours: number;
  crusts: string[];
  fillings: string[];
  custom: string[];
  tiers: { from: number; to: number | null; price: number }[];
}

export interface ShopNotification {
  id: string;
  title: string;
  detail: string;
  source: string;
  when: string;
  unread: boolean;
  to: string;
}
