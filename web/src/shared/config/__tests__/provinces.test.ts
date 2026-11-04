import { describe, it, expect } from 'vitest';
import { provinceCodeOf, provinceNameOf, DEFAULT_PROVINCE_CODE, PROVINCE_ITEMS } from '../provinces';

describe('Shared Config - province mapping', () => {
  it('chuyển tên tỉnh sang mã số 2 chữ số của backend', () => {
    expect(provinceCodeOf('Hà Nội')).toBe('01');
    expect(provinceCodeOf('TP Hồ Chí Minh')).toBe('79');
    expect(provinceCodeOf('Hải Phòng')).toBe('31');
    expect(provinceCodeOf('Cần Thơ')).toBe('92');
  });

  it('không phân biệt hoa thường và khoảng trắng thừa', () => {
    expect(provinceCodeOf('  hà nội  ')).toBe('01');
    expect(provinceCodeOf('TP. Hồ Chí Minh')).toBe('79');
  });

  it('chuyển mã số sang tên hiển thị', () => {
    expect(provinceNameOf('01')).toBe('Hà Nội');
    expect(provinceNameOf('79')).toBe('TP Hồ Chí Minh');
    expect(provinceNameOf('99')).toBe('');
  });

  it('mã số đã có thì giữ nguyên', () => {
    expect(provinceCodeOf('01')).toBe('01');
    expect(provinceCodeOf('79')).toBe('79');
  });

  it('tỉnh lạ hoặc rỗng rơi về Hà Nội', () => {
    expect(provinceCodeOf(undefined)).toBe(DEFAULT_PROVINCE_CODE);
    expect(provinceCodeOf('')).toBe(DEFAULT_PROVINCE_CODE);
    expect(provinceCodeOf('Vùng đất không tồn tại')).toBe(DEFAULT_PROVINCE_CODE);
  });

  it('danh sách tỉnh khớp với 34 đơn vị hành chính của backend', () => {
    expect(PROVINCE_ITEMS).toHaveLength(34);
    const codes = PROVINCE_ITEMS.map((p) => p.code);
    expect(new Set(codes).size).toBe(34);
    expect(codes.every((c) => /^\d{2}$/.test(c))).toBe(true);
  });
});
