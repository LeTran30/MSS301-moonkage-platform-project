/** A quote request that reached the vendor, as the vendor channel shows it (B3.0, B3.1). */
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
