/**
 * Validator utilities cho Form tiếng Việt (T-16)
 * Giúp kiểm tra tính hợp lệ trước khi submit và gắn aria-invalid / aria-describedby
 */

export const validators = {
  required(value: string | number | undefined | null, fieldName = 'Trường này'): string | null {
    if (value === undefined || value === null || String(value).trim() === '') {
      return `${fieldName} không được để trống`;
    }
    return null;
  },

  email(value: string): string | null {
    if (!value || !value.trim()) return 'Email không được để trống';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return 'Email không hợp lệ (ví dụ: ten@mien.vn)';
    }
    return null;
  },

  phoneVN(value: string): string | null {
    if (!value || !value.trim()) return 'Số điện thoại không được để trống';
    const cleaned = value.replace(/\s+/g, '');
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(cleaned)) {
      return 'Số điện thoại Việt Nam gồm 10 số (bắt đầu bằng 03, 05, 07, 08, 09)';
    }
    return null;
  },

  /**
   * Định danh đăng nhập: email **hoặc** số điện thoại.
   *
   * Backend `LoginRequest.username` nhận cả hai (xem `midfi-content-spec.md`
   * M5.4), và tài khoản mẫu trong seed dùng email. Vì vậy form không được
   * bắt buộc số điện thoại — chỉ cần một định danh hợp lệ.
   */
  loginIdentifier(value: string): string | null {
    if (!value || !value.trim()) return 'Email hoặc số điện thoại không được để trống';
    const trimmed = value.trim();
    if (trimmed.includes('@')) return validators.email(trimmed);
    return validators.phoneVN(trimmed);
  },

  password(value: string): string | null {
    if (!value) return 'Mật khẩu không được để trống';
    if (value.length < 8) {
      return 'Mật khẩu phải có tối thiểu 8 ký tự';
    }
    return null;
  },

  taxCode(value: string): string | null {
    if (!value || !value.trim()) return 'Mã số thuế không được để trống';
    const cleaned = value.trim();
    // Mã số thuế doanh nghiệp Việt Nam gồm 10 hoặc 13 số (10 số chính + 3 số chi nhánh)
    if (!/^\d{10}(-\d{3})?$/.test(cleaned) && !/^\d{13}$/.test(cleaned)) {
      return 'Mã số thuế doanh nghiệp phải gồm 10 hoặc 13 chữ số';
    }
    return null;
  },
};
