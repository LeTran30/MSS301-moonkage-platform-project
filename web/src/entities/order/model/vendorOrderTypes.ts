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
    daysLeft: number;
    proposal?: { kind: string; amount: number; note: string };
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
  progress: { label: string; at: string }[];
  held: number;
  disbursed: number;
  invoiceAttached: boolean;
}

export type VendorOrder = VendorReadyOrder | VendorCustomOrder;
