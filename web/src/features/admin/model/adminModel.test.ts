import { describe, expect, it } from 'vitest';
import { seedApplications, seedProvinceFees, seedReconciliation } from '../api/seed';
import { missingFees, mismatches, ownerMatch } from './adminModel';

describe('admin model', () => {
  it('matches the owner on paper with the chip, ignoring case', () => {
    expect(ownerMatch(seedApplications[0])).toEqual({ name: true, id: true });
    expect(ownerMatch(seedApplications[2])).toEqual({ name: true, id: false });
  });

  it('lists provinces without a fee', () => {
    expect(missingFees(seedProvinceFees)).toEqual(['Cà Mau']);
    expect(seedProvinceFees).toHaveLength(34);
  });

  it('flags VNPay amounts that differ from the system', () => {
    expect(mismatches(seedReconciliation).map((r) => r.id)).toEqual(['MK-8702']);
  });
});
