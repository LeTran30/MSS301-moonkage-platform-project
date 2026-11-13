import { describe, expect, it } from 'vitest';
import { vietnamBusinessDate } from '../vietnamBusinessDate';

describe('vietnamBusinessDate', () => {
  it('changes date at Vietnam midnight instead of UTC midnight', () => {
    expect(vietnamBusinessDate(new Date('2026-11-12T16:59:59Z'))).toBe('2026-11-12');
    expect(vietnamBusinessDate(new Date('2026-11-12T17:00:00Z'))).toBe('2026-11-13');
  });
});
