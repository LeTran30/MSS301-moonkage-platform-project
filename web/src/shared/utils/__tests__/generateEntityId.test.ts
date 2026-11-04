import { describe, it, expect } from 'vitest';
import { generateEntityId } from '../index';

describe('Shared Utils - generateEntityId (T-19)', () => {
  it('tạo entity id với tiền tố và dấu phân cách mặc định', () => {
    const id = generateEntityId('ORD');
    expect(id).toMatch(/^ORD_[a-z0-9-]+$/i);
  });

  it('hỗ trợ tùy biến dấu phân cách', () => {
    const id = generateEntityId('REQ', '-');
    expect(id).toMatch(/^REQ-[a-z0-9-]+$/i);
  });

  it('sinh ra các ID khác nhau qua các lần gọi liên tiếp', () => {
    const id1 = generateEntityId('TEST');
    const id2 = generateEntityId('TEST');
    expect(id1).not.toBe(id2);
  });
});
