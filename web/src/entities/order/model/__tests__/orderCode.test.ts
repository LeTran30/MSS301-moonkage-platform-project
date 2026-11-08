import { describe, expect, it } from 'vitest';
import { orderCode } from '../orderCode';

describe('orderCode', () => {
  it('names an order by the end of its ID, upper case', () => {
    expect(orderCode('ffadfdc8-6746-4044-aca6-35f6db865c6e')).toBe('DB865C6E');
  });

  it('tells the seed orders apart, whose IDs share their start', () => {
    expect(orderCode('00000000-0000-4000-8000-000500000039')).toBe('00000039');
    expect(orderCode('00000000-0000-4000-8000-000500000040')).toBe('00000040');
  });
});
