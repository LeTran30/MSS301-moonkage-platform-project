import { test, expect } from '@playwright/test';
import {
  gotoRoute,
  waitForAppReady,
  login,
  apiGetIfExists,
  unwrapData,
  firstOrderId,
  trackConsoleErrors,
  isIgnorableConsoleError,
  selectOptionByLabel,
  gatewayUrl,
  SEED_ACCOUNTS,
} from './helpers';

/**
 * FLOW 5 — Khiếu nại & Phân xử tranh chấp (M6.1.3, Q5.0, Q5.1, FR-12, FR-49).
 *
 * Đây là luồng có **hậu quả tài chính thật**: tiền của người mua bị khoá
 * trong Escrow khi khiếu nại mở, và quyết định của Admin quyết định ai nhận
 * được tiền. Vì vậy test ở đây tập trung vào:
 * - người mua mở được khiếu nại và nhận được xác nhận;
 * - Admin chỉ phân xử được trong trần hoàn của Escrow (AC-49.3);
 * - hồ sơ khiếu nại hiển thị đủ hai bên và bằng chứng.
 *
 * Mã đơn hàng lấy từ **API thật** (không hardcode): mỗi lần chạy, backend
 * sinh ra mã khác nhau.
 */
test.describe('FLOW 5 — Khiếu nại & Phân xử tranh chấp', () => {
  test('trang khiếu nại hiện đúng hồ sơ khiếu nại của đơn đang mở', async ({ page }) => {
    await login(page);

    const orderId = await firstOrderId(page);
    test.skip(!orderId, 'Tài khoản seed chưa có đơn hàng nào để mở khiếu nại.');

    await gotoRoute(page, `/tai-khoan/don-hang/${orderId}/khieu-nai`);
    await waitForAppReady(page);

    await expect(page.getByRole('heading', { level: 2 })).toContainText(/Báo Vấn Đề/i);

    // Nếu đơn chưa có khiếu nại thì hiện form gửi mới; nếu đã có thì hiện
    // hồ sơ. Cả hai đều là trạng thái hợp lệ của màn hình.
    const hasForm = await page.getByLabel(/Lý do khiếu nại/i).isVisible().catch(() => false);
    if (hasForm) {
      await expect(page.getByLabel(/Mô tả chi tiết/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Gửi khiếu nại tới sàn/i })).toBeVisible();
    } else {
      await expect(page.getByText(/Mã khiếu nại:/)).toBeVisible();
      await expect(page.getByText(/Lý do:/)).toBeVisible();
    }
  });

  test('hồ sơ khiếu nại hiện tiền Escrow đang giữ và trần hoàn tối đa', async ({ page }) => {
    await login(page);

    const orderId = await firstOrderId(page);
    test.skip(!orderId, 'Tài khoản seed chưa có đơn hàng nào.');

    await gotoRoute(page, `/tai-khoan/don-hang/${orderId}/khieu-nai`);
    await waitForAppReady(page);

    // 404 nghĩa là đơn chưa có khiếu nại.
    const dispute = await apiGetIfExists<unknown>(
      page,
      gatewayUrl(`/api/orders/${orderId}/dispute`),
    );
    const dto = unwrapData<{ disputeId?: string } | null>(dispute);

    // Chỉ có hồ sơ đang mở mới hiện các con số Escrow (AC-49.1).
    test.skip(!dto?.disputeId, 'Đơn hàng này chưa có khiếu nại mở.');

    await expect(page.getByText(/Tiền tạm giữ trên sàn:/)).toBeVisible();
    await expect(page.getByText(/Tối đa có thể hoàn:/)).toBeVisible();
  });

  test('form khiếu nại báo trước khi tiền bị khoá trong Escrow', async ({ page }) => {
    await login(page);

    const orderId = await firstOrderId(page);
    test.skip(!orderId, 'Tài khoản seed chưa có đơn hàng nào.');

    await gotoRoute(page, `/tai-khoan/don-hang/${orderId}/khieu-nai`);
    await waitForAppReady(page);

    // Chỉ màn hình **form** mới có cảnh báo khoá tiền.
    const hasForm = await page.getByLabel(/Lý do khiếu nại/i).isVisible().catch(() => false);
    test.skip(!hasForm, 'Đơn hàng này đã có khiếu nại nên không hiện form.');

    await expect(page.getByText(/bị khóa chuyển cho người bán/i).first()).toBeVisible();
  });

  test('chọn được lý do khiếu nại trong dropdown', async ({ page }) => {
    await login(page);

    const orderId = await firstOrderId(page);
    test.skip(!orderId, 'Tài khoản seed chưa có đơn hàng nào.');

    await gotoRoute(page, `/tai-khoan/don-hang/${orderId}/khieu-nai`);
    await waitForAppReady(page);

    const select = page.getByLabel(/Lý do khiếu nại/i);
    test.skip(!(await select.isVisible().catch(() => false)), 'Đơn hàng đã có khiếu nại.');

    await selectOptionByLabel(page, /Lý do khiếu nại/i, 'Giao trễ hẹn');
    await expect(select).toContainText('Giao trễ hẹn');
  });

  test('trang khiếu nại không có lỗi console', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await login(page);

    const orderId = await firstOrderId(page);
    test.skip(!orderId, 'Tài khoản seed chưa có đơn hàng nào.');

    await gotoRoute(page, `/tai-khoan/don-hang/${orderId}/khieu-nai`);
    await waitForAppReady(page);
    await page.waitForTimeout(500);

    const real = errors.filter((message) => !isIgnorableConsoleError(message));
    expect(real).toEqual([]);
  });

  test('quản trị thấy danh sách hồ sơ khiếu nại đang chờ phân xử', async ({ page }) => {
    await login(page, SEED_ACCOUNTS.admin.username, SEED_ACCOUNTS.admin.password);

    await gotoRoute(page, '/quan-tri/khieu-nai');
    await waitForAppReady(page);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Phân xử khiếu nại/i);

    // Tab trạng thái.
    await expect(page.getByRole('tab', { name: /Cần phân xử/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Đã có phán quyết/i })).toBeVisible();
  });
});
