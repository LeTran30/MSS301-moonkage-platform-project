import { describe, expect, it } from 'vitest';
import { tierPrice } from './vendorTerms';
import type { CustomTerms } from './types';

const terms: CustomTerms = {
  minBoxes: 20,
  mockupHours: 24,
  crusts: [],
  fillings: [],
  custom: [],
  tiers: [
    { from: 20, to: 99, price: 130000 },
    { from: 100, to: 199, price: 120000 },
    { from: 200, to: null, price: 110000 },
  ],
};

describe('vendor terms', () => {
  it('suggests the tier price for a box count', () => {
    expect(tierPrice(terms, 150)).toBe(120000);
    expect(tierPrice(terms, 500)).toBe(110000);
    expect(tierPrice(terms, 5)).toBeNull();
  });
});
