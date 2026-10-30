export interface VendorProduct {
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
