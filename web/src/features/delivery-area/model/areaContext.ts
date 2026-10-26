import { createContext } from 'react';

export interface DeliveryAreaValue {
  /** Province products, prices and fees are shown for. */
  area: string;
  /** False until the visitor picks one; the home page then asks (AC-05.3). */
  chosen: boolean;
  provinces: string[];
  setArea: (province: string) => void;
}

export const DeliveryAreaContext = createContext<DeliveryAreaValue | null>(null);
