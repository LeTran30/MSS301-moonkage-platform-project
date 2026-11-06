import { describe, it, expect } from 'vitest';
import { unwrap, unwrapOrThrow, unwrapList, unwrapPage, isEnvelope } from '../envelope';
import { envelope, page } from '../__tests__/envelopeFixtures';

describe('Shared API - Envelope unwrapping', () => {
  it('isEnvelope nhận diện đúng envelope của backend', () => {
    expect(isEnvelope(envelope({ a: 1 }))).toBe(true);
    expect(isEnvelope({ a: 1 })).toBe(false);
    expect(isEnvelope(null)).toBe(false);
    expect(isEnvelope([1, 2, 3])).toBe(false);
  });

  it('unwrap trả về payload nằm trong envelope', () => {
    expect(unwrap<{ id: string }>(envelope({ id: 'x' }))).toEqual({ id: 'x' });
  });

  it('unwrap trả về null khi payload rỗng', () => {
    expect(unwrap(envelope(null))).toBeNull();
    expect(unwrap(undefined)).toBeNull();
  });

  it('unwrap vẫn chấp nhận payload trần cho endpoint internal', () => {
    expect(unwrap<{ id: string }>({ id: 'x' })).toEqual({ id: 'x' });
  });

  it('unwrapOrThrow ném lỗi khi payload vắng mặt', () => {
    expect(() => unwrapOrThrow(envelope(null))).toThrow(/dữ liệu rỗng/);
    expect(unwrapOrThrow(envelope({ id: 'x' }))).toEqual({ id: 'x' });
  });

  it('unwrapList bóc mảng trong envelope', () => {
    expect(unwrapList(envelope([1, 2, 3]))).toEqual([1, 2, 3]);
    expect(unwrapList(envelope({ data: [1, 2] }))).toEqual([1, 2]);
    expect(unwrapList(envelope(null))).toEqual([]);
  });

  it('unwrapPage bóc content của trang phân trang', () => {
    expect(unwrapPage(envelope(page([1, 2, 3])))).toEqual([1, 2, 3]);
    expect(unwrapPage(envelope([1, 2]))).toEqual([1, 2]);
    expect(unwrapPage(envelope(null))).toEqual([]);
  });
});
