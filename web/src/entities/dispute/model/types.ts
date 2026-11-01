export interface Dispute {
  id: string;
  orderId: string;
  openedAt: string;
  buyer: string;
  vendor: string;
  reason: string;
  buyerText: string;
  /** Short-lived links to the buyer's photos; none in the demo. */
  buyerPhotoUrls?: string[];
  /** The demo's structured proposal; on the server the vendor answers with evidence and a note (vendorReplies). */
  vendorProposal?: { kind: string; amount: number; note: string };
  vendorReplies?: { note: string; fileUrl: string; at: string }[];
  lines: { name: string; amount: number }[];
  held: number;
  paidOut: number;
  history: { label: string; at: string }[];
  state: 'open' | 'decided' | 'manual';
  decision?: { kind: string; amount: number; note: string; at: string };
}
