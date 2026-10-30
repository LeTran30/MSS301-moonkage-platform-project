export type RequestStatus = 'waiting' | 'new-quotes' | 'accepted' | 'closed';

export interface Quote {
  id?: string;
  vendorId: string;
  vendorName: string;
  total: number;
  boxes: number;
  depositPercent: number;
  /** DD/MM/YYYY */
  deliverBy: string;
  custom: string;
  rating: number;
  customOrders: number;
  /** Quote no longer valid (expired, withdrawn). */
  expired?: boolean;
}

export interface QuoteRequest {
  id: string;
  kind: 'open' | 'direct';
  /** For a direct request: the vendor it was sent to. */
  directTo?: string;
  boxes: number;
  perBox: string;
  crusts: string[];
  fillings: string[];
  custom: string;
  deliverTo: string;
  deliverBy: string;
  note?: string;
  createdAt: string;
  invited: { vendorId: string; vendorName: string }[];
  quotes: Quote[];
  status: RequestStatus;
  acceptedVendorId?: string;
}
