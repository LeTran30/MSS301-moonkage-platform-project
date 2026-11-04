import { test, expect } from '@playwright/test';
import { gotoRoute, waitForAppReady, trackConsoleErrors, isIgnorableConsoleError } from './helpers';

/**
 * FLOW 6 — Xác minh danh tính NFC (M6.4, FR-04, AC-04.1).
 *
 * Luồng này là cổng chặn cho mọi giao dịch B2B và cho việc mở Shop. Test
 * ở đây kiểm tra **hợp đồng của giao diện** với ứng dụng di động
 * (Moonkage Verify, V1→V5) — đúng những gì backend dựa vào để đánh dấu
 * tài khoản là đã định danh.
 *
 * Lưu ý: trang này chỉ mở được khi đã đăng nhập (guard `RequireAuth`).
 */
test.describe('FLOW 6 — Xác minh danh tính NFC', () => {
  /** Đặt persona demo chưa định danh (NFC chưa xác minh). */
  async function useUnverifiedBuyer(page: import('@playwright/test').Page) {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'moonkage_current_user',
        JSON.stringify({
          id: 'usr_minh',
          name: 'Anh Minh',
          email: 'minh.retail@gmail.com',
          phone: '0903123456',
          role: 'BUYER',
          nfcStatus: 'UNVERIFIED',
          idCardNumberMasked: '0792••••4567',
        }),
      );
    });
  }

  test('trang xác minh hiện QR, hướng dẫn 3 bước và trạng thái định danh', async ({ page }) => {
    await useUnverifiedBuyer(page);
    await gotoRoute(page, '/tai-khoan/xac-minh');
    await waitForAppReady(page);

    await expect(page.getByRole('heading', { level: 2 })).toContainText(/Xác Thực Thẻ Căn Cước/i);

    // Trạng thái định danh.
    await expect(page.getByText('CHƯA ĐỊNH DANH')).toBeVisible();

    // Hướng dẫn 3 bước.
    await expect(page.getByText(/Mở ứng dụng/i).first()).toBeVisible();
    await expect(page.getByText(/Quét mã QR/i).first()).toBeVisible();
    await expect(page.getByText(/Áp thẻ Căn cước công dân/i).first()).toBeVisible();
  });

  test('phiên xác minh có mã hiển thị và nút tạo mã QR mới', async ({ page }) => {
    await useUnverifiedBuyer(page);
    await gotoRoute(page, '/tai-khoan/xac-minh');
    await waitForAppReady(page);

    // Phiên được mở tự động khi tài khoản chưa định danh (AC-04.1).
    await expect(page.getByLabel('Mã phiên xác minh')).toBeVisible();
    await expect(page.getByRole('button', { name: /Tạo mã QR mới/i })).toBeVisible();
  });

  test('khung điện thoại giả lập đi qua đủ 5 màn hình V1→V5', async ({ page }) => {
    await useUnverifiedBuyer(page);
    await gotoRoute(page, '/tai-khoan/xac-minh');
    await waitForAppReady(page);

    // V1 — đăng nhập ứng dụng.
    await expect(page.getByText(/MÀN APP V1/i)).toBeVisible();
    await page.getByRole('button', { name: /Tiếp tục quét QR/i }).click();

    // V2 — quét mã QR.
    await expect(page.getByText(/MÀN APP V2/i)).toBeVisible();
    await page.getByRole('button', { name: /Quét thành công/i }).click();

    // V3 — chạm thẻ NFC.
    await expect(page.getByText(/MÀN APP V3/i)).toBeVisible();
    await page.getByRole('button', { name: /Đọc chip xong/i }).click();

    // V4 — kiểm tra thông tin, chỉ hiện số CCCD đã che.
    await expect(page.getByText(/MÀN APP V4/i)).toBeVisible();
    await expect(page.getByText('Hợp lệ (Bộ Công An)')).toBeVisible();

    // V5 — hoàn tất.
    await page.getByRole('button', { name: /Xác nhận/i }).click();
    await expect(page.getByText(/MÀN APP V5/i)).toBeVisible();
    await expect(page.getByText(/Định danh thành công/i)).toBeVisible();
  });

  test('popup giả lập quét NFC chạy đủ 3 bước', async ({ page }) => {
    await useUnverifiedBuyer(page);
    await gotoRoute(page, '/tai-khoan/xac-minh');
    await waitForAppReady(page);

    await page.getByRole('button', { name: /Mở popup giả lập quét NFC/i }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/Bước 1: Chạm thẻ CCCD/i)).toBeVisible();

    await modal.getByRole('button', { name: /Bắt đầu quét NFC/i }).click();

    // Bước 2 và bước 3 xuất hiện sau khi mô phỏng đọc thẻ xong.
    await expect(modal.getByText(/Bước 2: Đối chiếu/i)).toBeVisible({ timeout: 10_000 });
    await expect(modal.getByText(/Bước 3: Xác thực thành công/i)).toBeVisible({ timeout: 10_000 });
  });

  test('tài khoản đã định danh thì hiện trạng thái đã định danh', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'moonkage_current_user',
        JSON.stringify({
          id: 'usr_lan',
          name: 'Chị Lan',
          email: 'lan.hr@globalcorp.vn',
          phone: '0918889999',
          role: 'BUYER',
          nfcStatus: 'VERIFIED',
          idCardNumberMasked: '0011••••9876',
        }),
      );
    });

    await gotoRoute(page, '/tai-khoan/xac-minh');
    await waitForAppReady(page);

    await expect(page.getByText('ĐÃ ĐỊNH DANH')).toBeVisible();
    await expect(page.getByText(/Tài khoản đã được xác minh thành công/i)).toBeVisible();
  });

  test('trang xác minh không có lỗi console', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await useUnverifiedBuyer(page);
    await gotoRoute(page, '/tai-khoan/xac-minh');
    await waitForAppReady(page);
    await page.waitForTimeout(500);

    const real = errors.filter((message) => !isIgnorableConsoleError(message));
    expect(real).toEqual([]);
  });
});
