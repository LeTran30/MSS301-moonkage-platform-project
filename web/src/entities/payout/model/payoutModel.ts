import type { Reconciliation, Settlement } from './types';

export const settlementTotal = (s: Settlement) => s.goods + s.shipping;
export const mismatches = (r: Reconciliation) => r.rows.filter((row) => row.vnpay !== row.system);
