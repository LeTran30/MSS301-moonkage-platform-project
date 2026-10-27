import type { ProvinceFee } from './types';

/** Provinces still without a fee: the table cannot be saved while any is left (AC-52.3). */
export const missingFees = (fees: ProvinceFee[]) => fees.filter((f) => f.fee === null).map((f) => f.province);
