export interface AdminProduct {
  id: string;
  name: string;
  shop: string;
  price: number;
  removed?: { reason: string; at: string };
}
