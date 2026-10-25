export type ReadyStatus = 'pending' | 'shipping' | 'delivered' | 'cancelled';
export type CustomStep = 'deposit' | 'mockup' | 'production' | 'delivery' | 'remaining' | 'done';

export interface OrderLine {
  name: string;
  price: number;
  quantity: number;
}

export interface Address {
  name: string;
  phone: string;
  line: string;
}

export interface Invoice {
  company: string;
  taxCode: string;
  email: string;
}

/** An order of ready-made products: one shop, paid with others in one VNPay payment (M6.1.1). */
export interface ReadyOrder {
  kind: 'ready';
  id: string;
  shop: string;
  paymentId: string;
  /** DD/MM/YYYY */
  placedAt: string;
  lines: OrderLine[];
  shippingFee: number;
  status: ReadyStatus;
  tracking?: string;
  expectedAt?: string;
  deliveredAt?: string;
  address: Address;
  invoice?: Invoice;
  history: { label: string; at: string }[];
  /** Days after delivery during which "Báo vấn đề với đơn" shows. */
  complaintDays: number;
  complaintId?: string;
}

export interface Mockup {
  version: number;
  sentAt: string;
  note: string;
  state: 'waiting' | 'revise' | 'approved';
  feedback?: string;
}

/** An order to request (custom): deposit, mockup, production, delivery, rest (M6.1.2). */
export interface CustomOrder {
  kind: 'custom';
  id: string;
  supplier: string;
  title: string;
  requestId: string;
  value: number;
  depositPercent: number;
  depositPaidAt: string;
  step: CustomStep;
  mockups: Mockup[];
  progress: { label: string; at: string }[];
  deliveredAt?: string;
  invoiceAttached: boolean;
}

export type Order = ReadyOrder | CustomOrder;

export interface Complaint {
  id: string;
  orderId: string;
  shop: string;
  reason: string;
  description: string;
  photos: number;
  sentAt: string;
  events: { label: string; at: string }[];
  decision?: { title: string; amount: number; body: string; at: string };
}
