import { describe, expect, it } from 'vitest';
import { formatRating, formatVnd } from './money';

describe('formatVnd', () => {
  it('groups thousands with dots and appends đ', () => {
    expect(formatVnd(680000)).toBe('680.000đ');
    expect(formatVnd(18000000)).toBe('18.000.000đ');
    expect(formatVnd(0)).toBe('0đ');
    expect(formatVnd(950)).toBe('950đ');
  });

  it('rounds and keeps the sign', () => {
    expect(formatVnd(1234.6)).toBe('1.235đ');
    expect(formatVnd(-25000)).toBe('-25.000đ');
  });
});

describe('formatRating', () => {
  it('uses a comma and one decimal', () => {
    expect(formatRating(4.8)).toBe('4,8');
    expect(formatRating(5)).toBe('5,0');
  });
});
