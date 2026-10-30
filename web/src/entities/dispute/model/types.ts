export interface Dispute {
  id: string;
  orderId: string;
  openedAt: string;
  buyer: string;
  vendor: string;
  reason: string;
  buyerText: string;
  vendorProposal?: { kind: string; amount: number; note: string };
  lines: { name: string; amount: number }[];
  held: number;
  paidOut: number;
  history: { label: string; at: string }[];
  state: 'open' | 'decided' | 'manual';
  decision?: { kind: string; amount: number; note: string; at: string };
}
