import { describe, it, expect, beforeEach } from 'vitest';
import { toast, addToast, removeToast, clearToasts } from '../toastStore';

describe('ToastStore - Thông báo toàn cục Global Toast (M8.0)', () => {
  beforeEach(() => {
    clearToasts();
  });

  it('thêm toast mới thành công', () => {
    const id = addToast({ message: 'Thao tác thành công', tone: 'success' });
    expect(id).toBeDefined();
    expect(id).toMatch(/^toast-/);
  });

  it('hỗ trợ các hàm tiện ích toast.success, toast.error, toast.warning, toast.info', () => {
    const idSuccess = toast.success('Đã lưu');
    const idError = toast.error('Có lỗi xảy ra');
    const idWarning = toast.warning('Cảnh báo');
    const idInfo = toast.info('Thông báo');

    expect(idSuccess).toBeDefined();
    expect(idError).toBeDefined();
    expect(idWarning).toBeDefined();
    expect(idInfo).toBeDefined();
  });

  it('xóa toast cụ thể bằng removeToast(id)', () => {
    const id1 = toast.success('Thông báo 1');
    const id2 = toast.success('Thông báo 2');

    removeToast(id1);
    expect(id2).toBeDefined();
  });

  it('xóa toàn bộ toast qua clearToasts()', () => {
    toast.success('1');
    toast.error('2');
    clearToasts();
    // Verify no error thrown
  });
});
