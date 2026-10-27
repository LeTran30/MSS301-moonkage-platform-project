export type RequestStatus = 'waiting' | 'new-quotes' | 'accepted' | 'closed';

export interface Quote {
  id?: string;
  supplierId: string;
  supplierName: string;
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
  /** For a direct request: the supplier it was sent to. */
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
  invited: { supplierId: string; supplierName: string }[];
  quotes: Quote[];
  status: RequestStatus;
  acceptedSupplierId?: string;
}
