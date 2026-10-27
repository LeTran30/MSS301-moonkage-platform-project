import { describe, expect, it } from 'vitest';
import { seedReconciliation } from '../api/platformMoneySeed';
import { mismatches } from './payoutModel';

describe('platform money model', () => {
  it('flags VNPay amounts that differ from the system', () => {
    expect(mismatches(seedReconciliation).map((r) => r.id)).toEqual(['MK-8702']);
  });
});
