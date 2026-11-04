import { describe, it, expect } from 'vitest';
import { checkIsDataEmpty } from '../checkIsDataEmpty';

describe('Shared UI - AsyncState empty detection (N5)', () => {
  it('nhận diện mảng rỗng [] là empty', () => {
    expect(checkIsDataEmpty([])).toBe(true);
    expect(checkIsDataEmpty(['Bánh nướng'])).toBe(false);
  });

  it('nhận diện đối tượng phân trang { content: [] } là empty', () => {
    expect(checkIsDataEmpty({ content: [] })).toBe(true);
    expect(checkIsDataEmpty({ content: [{ id: '1' }] })).toBe(false);
  });

  it('nhận diện đối tượng phân trang { items: [] } là empty', () => {
    expect(checkIsDataEmpty({ items: [] })).toBe(true);
    expect(checkIsDataEmpty({ items: ['item1'] })).toBe(false);
  });

  it('nhận diện đối tượng phân trang { total: 0 } là empty', () => {
    expect(checkIsDataEmpty({ total: 0 })).toBe(true);
    expect(checkIsDataEmpty({ total: 10 })).toBe(false);
  });

  it('tôn trọng hàm isEmpty tùy biến được truyền vào', () => {
    const customEmpty = (data: { count: number }) => data.count === 0;
    expect(checkIsDataEmpty({ count: 0 }, customEmpty)).toBe(true);
    expect(checkIsDataEmpty({ count: 5 }, customEmpty)).toBe(false);
  });
});
