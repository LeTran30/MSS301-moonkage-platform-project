export interface ProvinceFee {
  province: string;
  fee: number | null;
}

export interface Taxonomy {
  crusts: { name: string; visible: boolean }[];
  fillings: { name: string; visible: boolean }[];
}
