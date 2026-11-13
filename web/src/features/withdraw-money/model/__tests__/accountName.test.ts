import { describe, expect, it } from 'vitest';
import { toAccountName } from '../accountName';

describe('toAccountName', () => {
  it('viết hoa, bỏ dấu và chữ đ như tên in trên thẻ ngân hàng', () => {
    expect(toAccountName('Nguyễn Thị Lan')).toBe('NGUYEN THI LAN');
    expect(toAccountName('Đỗ Minh Tâm')).toBe('DO MINH TAM');
  });

  it('bỏ ký tự không phải chữ và gộp khoảng trắng', () => {
    expect(toAccountName('Lê  Văn-An 2')).toBe('LE VANAN ');
  });
});
