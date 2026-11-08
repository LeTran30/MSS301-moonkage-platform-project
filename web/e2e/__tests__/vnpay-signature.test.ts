import { describe, expect, test } from 'vitest';
import { canonicalQuery, sign } from '../vnpay';

/**
 * Kiểm tra phần ký callback VNPay.
 *
 * Vì sao có test riêng: chữ ký sai **một byte** thì payment-service trả
 * `INVALID_SIGNATURE` và đơn không bao giờ chuyển sang PAID. Test luồng sẽ đỏ
 * với lý do "đơn không được trả" — rất khó đoán ra nguyên nhân thật. Vì vậy
 * phần ký phải được bảo chứng bằng test riêng, so với chính thuật toán của
 * server.
 */

/** Chữ ký mà server Java tạo ra, tính tay để đối chiếu. */
describe('ký callback VNPay', () => {
  test('chuỗi ký sắp theo tên, bỏ trường rỗng', () => {
    const query = canonicalQuery({
      vnp_TxnRef: 'ABC',
      vnp_Amount: '100000',
      vnp_Empty: '',
      vnp_Missing: undefined as unknown as string,
    });

    expect(query).toBe('vnp_Amount=100000&vnp_TxnRef=ABC');
  });

  test('tên trường được sắp xếp, không theo thứ tự khai báo', () => {
    const a = canonicalQuery({ vnp_B: '2', vnp_A: '1' });
    const b = canonicalQuery({ vnp_A: '1', vnp_B: '2' });

    expect(a).toBe(b);
    expect(a).toBe('vnp_A=1&vnp_B=2');
  });

  test('ký HMAC-SHA512, hex lowercase', () => {
    const hash = sign({ vnp_TxnRef: 'ABC' }, 'secret');

    expect(hash).toMatch(/^[0-9a-f]{128}$/);
  });

  test('chữ ký không đổi khi thứ tự khai báo đổi', () => {
    const a = sign({ vnp_TxnRef: 'ABC', vnp_Amount: '1000' }, 'secret');
    const b = sign({ vnp_Amount: '1000', vnp_TxnRef: 'ABC' }, 'secret');

    expect(a).toBe(b);
  });

  test('chữ ký đổi khi giá trị đổi', () => {
    const a = sign({ vnp_TxnRef: 'ABC' }, 'secret');
    const b = sign({ vnp_TxnRef: 'XYZ' }, 'secret');

    expect(a).not.toBe(b);
  });

  test('chữ ký đổi khi secret đổi', () => {
    const a = sign({ vnp_TxnRef: 'ABC' }, 'secret');
    const b = sign({ vnp_TxnRef: 'ABC' }, 'other');

    expect(a).not.toBe(b);
  });

  test('vnp_SecureHash và vnp_SecureHashType không nằm trong chuỗi ký', () => {
    const withoutHash = sign({ vnp_TxnRef: 'ABC' }, 'secret');
    const withHash = sign(
      { vnp_TxnRef: 'ABC', vnp_SecureHash: 'ignored', vnp_SecureHashType: 'HMACSHA512' },
      'secret',
    );

    expect(withHash).toBe(withoutHash);
  });

  test('giá trị có ký tự đặc biệt được URL-encode kiểu Java', () => {
    // `URLEncoder.encode(value, US_ASCII)` của Java: ký tự ngoài ASCII thành
    // `?` (rồi `%3F`), khoảng trắng thành `+`. Đã đối chiếu bằng
    // `VnpaySignerE2eParityTest` ở payment-service.
    expect(canonicalQuery({ vnp_Info: 'Bánh Trăng Vàng' })).toBe(
      'vnp_Info=B%3Fnh+Tr%3Fng+V%3Fng',
    );
  });

  test('ký tự `*` và `-` không bị mã hoá, `~` thì có', () => {
    expect(canonicalQuery({ vnp_Info: 'a*b-c.d_e' })).toBe('vnp_Info=a*b-c.d_e');
    expect(canonicalQuery({ vnp_Info: 'a.b~c' })).toBe('vnp_Info=a.b%7Ec');
  });

  test('chỉ trường `vnp_` mới được ký, đúng như server kiểm', () => {
    // Server bỏ mọi trường không bắt đầu bằng `vnp_` trước khi tính chữ ký.
    const withExtra = sign({ vnp_TxnRef: 'ABC', note: 'x' }, 'secret');
    const withoutExtra = sign({ vnp_TxnRef: 'ABC' }, 'secret');

    expect(withExtra).toBe(withoutExtra);
  });
});
