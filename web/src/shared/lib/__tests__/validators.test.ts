import { describe, it, expect } from 'vitest';
import { validators } from '../validators';

describe('Shared Lib - Validators (T-16)', () => {
  it('required: phát hiện rỗng và cho phép giá trị hợp lệ', () => {
    expect(validators.required('')).toBe('Trường này không được để trống');
    expect(validators.required('   ')).toBe('Trường này không được để trống');
    expect(validators.required(null)).toBe('Trường này không được để trống');
    expect(validators.required(undefined)).toBe('Trường này không được để trống');
    expect(validators.required('Moonkage')).toBeNull();
    expect(validators.required(0)).toBeNull();
  });

  it('email: kiểm tra định dạng email chuẩn', () => {
    expect(validators.email('user@moonkage.vn')).toBeNull();
    expect(validators.email('not-an-email')).toBe('Email không hợp lệ (ví dụ: ten@mien.vn)');
    expect(validators.email('')).toBe('Email không được để trống');
  });

  it('phoneVN: kiểm tra 10 số điện thoại di động Việt Nam', () => {
    expect(validators.phoneVN('0912345678')).toBeNull();
    expect(validators.phoneVN('0388765432')).toBeNull();
    expect(validators.phoneVN('123456')).toBe('Số điện thoại Việt Nam gồm 10 số (bắt đầu bằng 03, 05, 07, 08, 09)');
    expect(validators.phoneVN('0212345678')).toBe('Số điện thoại Việt Nam gồm 10 số (bắt đầu bằng 03, 05, 07, 08, 09)');
  });

  it('password: yêu cầu tối thiểu 8 ký tự', () => {
    expect(validators.password('SecurePass123')).toBeNull();
    expect(validators.password('short')).toBe('Mật khẩu phải có tối thiểu 8 ký tự');
  });

  it('taxCode: kiểm tra mã số thuế doanh nghiệp 10 hoặc 13 số', () => {
    expect(validators.taxCode('0109988776')).toBeNull();
    expect(validators.taxCode('0109988776-001')).toBeNull();
    expect(validators.taxCode('0109988776001')).toBeNull();
    expect(validators.taxCode('123')).toBe('Mã số thuế doanh nghiệp phải gồm 10 hoặc 13 chữ số');
  });
});
