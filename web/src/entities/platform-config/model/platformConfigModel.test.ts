import { describe, expect, it } from 'vitest';
import { seedProvinceFees } from '../api/seed';
import { missingFees } from './platformConfigModel';

describe('platform config model', () => {
  it('lists provinces without a fee', () => {
    expect(missingFees(seedProvinceFees)).toEqual(['Cà Mau']);
    expect(seedProvinceFees).toHaveLength(34);
  });
});
