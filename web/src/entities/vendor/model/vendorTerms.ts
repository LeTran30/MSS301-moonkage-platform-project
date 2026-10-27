import type { CustomTerms } from './types';

/** Price per box suggested by the vendor's tiers for `boxes`. */
export function tierPrice(terms: CustomTerms, boxes: number): number | null {
  const tier = terms.tiers.find((t) => boxes >= t.from && (t.to === null || boxes <= t.to));
  return tier?.price ?? null;
}
