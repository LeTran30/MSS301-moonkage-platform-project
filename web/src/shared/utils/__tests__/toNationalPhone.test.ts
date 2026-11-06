import { describe, it, expect } from 'vitest';
import { toNationalPhone } from '../index';

describe('toNationalPhone', () => {
  it('thêm số 0 vào 9 chữ số thuê bao mà identity-service trả về', () => {
    expect(toNationalPhone('901000001')).toBe('0901000001');
  });

  it('giữ nguyên số đã ở dạng quốc gia hoặc giá trị khác', () => {
    expect(toNationalPhone('0901000001')).toBe('0901000001');
    expect(toNationalPhone(' 0901000001 ')).toBe('0901000001');
    expect(toNationalPhone('')).toBe('');
    expect(toNationalPhone(null)).toBe('');
  });
});
