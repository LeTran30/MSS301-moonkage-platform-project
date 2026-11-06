import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatRelative,
  maskMiddle,
  addDays,
} from '../index';

describe('Shared Utilities - Định dạng tiền tệ, ngày tháng và bảo mật dữ liệu', () => {
  it('formatCurrency format chuẩn VNĐ', () => {
    expect(formatCurrency(135000)).toMatch(/135[.,]000đ/);
    expect(formatCurrency(0)).toBe('0đ');
  });

  it('formatNumber phân tách hàng nghìn', () => {
    expect(formatNumber(1000000)).toMatch(/1[.,]000[.,]000/);
  });

  it('formatDate chuyển đổi chuẩn ngày/tháng/năm', () => {
    const formatted = formatDate('2026-10-25T10:00:00Z');
    expect(formatted).toBe('25/10/2026');
  });

  it('formatDateTime hiển thị giờ:phút kèm ngày', () => {
    const dt = formatDateTime('2026-10-25T14:30:00.000Z');
    expect(dt).toContain('25/10/2026');
  });

  it('formatRelative tính toán thời gian tương đối', () => {
    const now = new Date('2026-10-25T12:00:00Z').getTime();
    expect(formatRelative('2026-10-25T11:59:45Z', now)).toBe('vừa xong');
    expect(formatRelative('2026-10-25T11:50:00Z', now)).toBe('10 phút trước');
    expect(formatRelative('2026-10-25T09:00:00Z', now)).toBe('3 giờ trước');
    expect(formatRelative('2026-10-23T12:00:00Z', now)).toBe('2 ngày trước');
  });

  it('maskMiddle che số CCCD, tài khoản ngân hàng nhạy cảm', () => {
    // "079203001234" -> 4 đầu + 4 chấm + 4 cuối
    const masked = maskMiddle('079203001234', 4, 4);
    expect(masked).toBe('0792••••1234');
    expect(masked.length).toBe(12);

    // Chuỗi quá ngắn thì giữ nguyên
    expect(maskMiddle('12345', 3, 3)).toBe('12345');
  });

  it('addDays cộng chính xác số ngày', () => {
    const d = addDays('2026-10-01T00:00:00.000Z', 10);
    expect(d).toContain('2026-10-11');
  });
});
