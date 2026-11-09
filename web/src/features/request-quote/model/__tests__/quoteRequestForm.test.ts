import { describe, it, expect } from 'vitest';
import { joinCustomSpec, validateQuoteForm } from '../quoteRequestForm';

const VALID = {
  quantity: '120',
  deliveryDeadline: '2026-12-05',
  recipientName: 'Nguyễn Thị Lan',
  recipientPhone: '0901000001',
  deliveryAddress: '25 Nguyễn Huệ',
};

describe('Features - quoteRequestForm', () => {
  it('không báo lỗi khi đủ thông tin và đạt mức tối thiểu', () => {
    expect(validateQuoteForm(VALID, 50, 'dưới mức')).toEqual({});
  });

  it('dùng mức tối thiểu và câu báo lỗi do trang truyền vào', () => {
    const errors = validateQuoteForm({ ...VALID, quantity: '20' }, 50, 'Đơn vị này nhận đặt từ 50 hộp trở lên');

    expect(errors.quantity).toBe('Đơn vị này nhận đặt từ 50 hộp trở lên');
  });

  it('báo từng trường còn trống', () => {
    const errors = validateQuoteForm(
      { quantity: ' ', deliveryDeadline: '', recipientName: ' ', recipientPhone: '', deliveryAddress: '' },
      1,
      'dưới mức',
    );

    expect(Object.keys(errors).sort()).toEqual(
      ['deliveryAddress', 'deliveryDeadline', 'quantity', 'recipientName', 'recipientPhone'].sort(),
    );
    expect(errors.quantity).toMatch(/không được để trống/);
  });

  it('ghép ghi chú, vỏ và nhân, bỏ phần trống', () => {
    expect(joinCustomSpec('In logo', 'Bánh nướng', '')).toBe('In logo | Vỏ: Bánh nướng');
    expect(joinCustomSpec('', '', 'Đậu xanh')).toBe('Nhân: Đậu xanh');
    expect(joinCustomSpec('', '', '')).toBe('');
  });
});
