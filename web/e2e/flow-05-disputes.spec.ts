import { test, expect } from '@playwright/test';
import { gotoRoute, waitForAppReady, trackConsoleErrors, isIgnorableConsoleError } from './helpers';

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
 * Lưu ý về dữ liệu demo: `MK-1042` **đã có** khiếu nại mở (`DISP-088`), nên
 * trang khiếu nại hiển thị trạng thái hồ sơ chứ không phải form. Muốn thử
 * form thì phải dùng một đơn chưa có khiếu nại (`MK-9821`) — và cần bỏ sạch
 * store demo trước, vì `disputeStore` được persist vào `localStorage`.
 */
test.describe('FLOW 5 — Khiếu nại & Phân xử tranh chấp', () => {
  /** Đơn hàng **đã có** khiếu nại mở trong dữ liệu demo. */
  const ORDER_WITH_DISPUTE = 'MK-1042';
  /** Đơn hàng **chưa có** khiếu nại — dùng để thử form gửi mới. */
  const ORDER_WITHOUT_DISPUTE = 'MK-9821';

  /** Dọn khiếu nại đã lưu để trang hiển thị form gửi mới. */
  async function clearDemoDisputes(page: import('@playwright/test').Page) {
    await page.addInitScript(() => {
      window.localStorage.removeItem('moonkage_disputes');
    });
  }

  test('trang khiếu nại hiện hồ sơ khiếu nại đang mở', async ({ page }) => {
    await gotoRoute(page, `/tai-khoan/don-hang/${ORDER_WITH_DISPUTE}/khieu-nai`);
    await waitForAppReady(page);

    await expect(page.getByRole('heading', { level: 2 })).toContainText(/Báo Vấn Đề/i);

    // Hồ sơ đang mở: mã khiếu nại + trạng thái + lý do.
    await expect(page.getByText(/Mã khiếu nại:/)).toBeVisible();
    await expect(page.getByText('OPEN')).toBeVisible();
    await expect(page.getByText(/Lý do:/)).toBeVisible();
  });

  test('hồ sơ khiếu nại hiện tiền Escrow đang giữ và trần hoàn tối đa', async ({ page }) => {
    await gotoRoute(page, `/tai-khoan/don-hang/${ORDER_WITH_DISPUTE}/khieu-nai`);
    await waitForAppReady(page);

    // AC-49.1: người mua phải thấy rõ tiền đang bị khoá và trần hoàn.
    await expect(page.getByText(/Tiền tạm giữ trên sàn:/)).toBeVisible();
    await expect(page.getByText(/Tối đa có thể hoàn:/)).toBeVisible();
  });

  test('hồ sơ khiếu nại hiện bằng chứng đính kèm của người mua', async ({ page }) => {
    await gotoRoute(page, `/tai-khoan/don-hang/${ORDER_WITH_DISPUTE}/khieu-nai`);
    await waitForAppReady(page);

    await expect(page.getByText(/Bằng chứng đính kèm:/)).toBeVisible();
    await expect(page.getByText(/Người mua:/).first()).toBeVisible();
  });

  test('đơn chưa có khiếu nại thì hiện form gửi khiếu nại', async ({ page }) => {
    await clearDemoDisputes(page);
    await gotoRoute(page, `/tai-khoan/don-hang/${ORDER_WITHOUT_DISPUTE}/khieu-nai`);
    await waitForAppReady(page);

    // Taxonomy lý do (FR-12) và mô tả chi tiết đều bắt buộc.
    await expect(page.getByLabel(/Lý do khiếu nại/i)).toBeVisible();
    await expect(page.getByLabel(/Mô tả chi tiết/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Gửi khiếu nại tới sàn/i })).toBeVisible();
  });

  test('form khiếu nại báo trước khi tiền bị khoá trong Escrow', async ({ page }) => {
    await clearDemoDisputes(page);
    await gotoRoute(page, `/tai-khoan/don-hang/${ORDER_WITHOUT_DISPUTE}/khieu-nai`);
    await waitForAppReady(page);

    // Người mua phải hiểu tiền bị khoá trước khi bấm gửi.
    await expect(page.getByText(/bị khóa chuyển cho người bán/i).first()).toBeVisible();
  });

  test('chọn được lý do khiếu nại trong dropdown', async ({ page }) => {
    await clearDemoDisputes(page);
    await gotoRoute(page, `/tai-khoan/don-hang/${ORDER_WITHOUT_DISPUTE}/khieu-nai`);
    await waitForAppReady(page);

    const select = page.getByLabel(/Lý do khiếu nại/i);
    await select.selectOption('LATE_DELIVERY');

    await expect(select).toHaveValue('LATE_DELIVERY');
  });

  test('gửi khiếu nại thành công thì quay lại trang đơn hàng', async ({ page }) => {
    await clearDemoDisputes(page);
    await gotoRoute(page, `/tai-khoan/don-hang/${ORDER_WITHOUT_DISPUTE}/khieu-nai`);
    await waitForAppReady(page);

    await page.getByLabel(/Mô tả chi tiết/i).fill('Hộp bánh bị bẹp góc, một chiếc bánh nứt.');
    await page.getByRole('button', { name: /Gửi khiếu nại tới sàn/i }).click();

    // Quay lại trang chi tiết đơn hàng sau khi gửi thành công.
    await expect(page).toHaveURL(new RegExp(`/tai-khoan/don-hang/${ORDER_WITHOUT_DISPUTE}`));
  });

  test('trang khiếu nại không có lỗi console', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await gotoRoute(page, `/tai-khoan/don-hang/${ORDER_WITH_DISPUTE}/khieu-nai`);
    await waitForAppReady(page);
    await page.waitForTimeout(500);

    const real = errors.filter((message) => !isIgnorableConsoleError(message));
    expect(real).toEqual([]);
  });

  test('quản trị thấy hồ sơ khiếu nại đang chờ phân xử', async ({ page }) => {
    // Đóng vai Admin bằng cách điền trực tiếp trạng thái demo vào store.
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'moonkage_current_user',
        JSON.stringify({
          id: 'usr_admin',
          name: 'Quản trị viên Moonkage',
          email: 'operator@moonkage.vn',
          phone: '0901000999',
          role: 'ADMIN',
          nfcStatus: 'VERIFIED',
        }),
      );
    });

    await gotoRoute(page, '/quan-tri/khieu-nai');
    await waitForAppReady(page);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Phân xử khiếu nại/i);

    // Tab trạng thái.
    await expect(page.getByRole('tab', { name: /Cần phân xử/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Đã có phán quyết/i })).toBeVisible();
  });

  test('hồ sơ khiếu nại cho Admin hiện đủ hai bên và tiền Escrow', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'moonkage_current_user',
        JSON.stringify({
          id: 'usr_admin',
          name: 'Quản trị viên Moonkage',
          email: 'operator@moonkage.vn',
          phone: '0901000999',
          role: 'ADMIN',
          nfcStatus: 'VERIFIED',
        }),
      );
    });

    await gotoRoute(page, '/quan-tri/khieu-nai');
    await waitForAppReady(page);

    // Hai bên tranh chấp.
    await expect(page.getByText('Người mua').first()).toBeVisible();
    await expect(page.getByText(/Người bán \/ Xưởng/i).first()).toBeVisible();

    // Tiền đang giữ trong Escrow.
    await expect(page.getByText(/Tiền đang giữ \(Escrow\)/i)).toBeVisible();
  });

  test('modal phán quyết hiện đủ 3 phương án và trần hoàn Escrow', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'moonkage_current_user',
        JSON.stringify({
          id: 'usr_admin',
          name: 'Quản trị viên Moonkage',
          email: 'operator@moonkage.vn',
          phone: '0901000999',
          role: 'ADMIN',
          nfcStatus: 'VERIFIED',
        }),
      );
    });

    await gotoRoute(page, '/quan-tri/khieu-nai');
    await waitForAppReady(page);

    const resolveButton = page.getByRole('button', { name: /Ra phán quyết giải quyết tranh chấp/i });
    await expect(resolveButton).toBeVisible();
    await resolveButton.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Ba phương án phân xử (FR-49).
    await expect(modal.getByText(/Hoàn tiền một phần/i)).toBeVisible();
    await expect(modal.getByText(/Hoàn 100% tiền đang giữ/i)).toBeVisible();
    await expect(modal.getByText(/Bác khiếu nại/i)).toBeVisible();

    // Số tiền Escrow đang giữ = trần hoàn (AC-49.3).
    await expect(modal.getByText(/đang giữ trong Escrow/i)).toBeVisible();

    // Căn cứ phán quyết là bắt buộc.
    await expect(modal.getByLabel(/Căn cứ/i)).toBeVisible();
  });

  test('AC-49.3: hoàn vượt trần Escrow thì bị chặn', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'moonkage_current_user',
        JSON.stringify({
          id: 'usr_admin',
          name: 'Quản trị viên Moonkage',
          email: 'operator@moonkage.vn',
          phone: '0901000999',
          role: 'ADMIN',
          nfcStatus: 'VERIFIED',
        }),
      );
    });

    await gotoRoute(page, '/quan-tri/khieu-nai');
    await waitForAppReady(page);

    await page.getByRole('button', { name: /Ra phán quyết giải quyết tranh chấp/i }).click();

    const modal = page.getByRole('dialog');
    // Nhập số tiền vượt trần Escrow.
    await modal.getByLabel(/Số tiền hoàn trả/i).fill('99999999');
    await modal.getByRole('button', { name: /Thi hành phán quyết/i }).click();

    // Phải bị chặn với thông báo viện dẫn AC-49.3 (hiện dạng toast).
    await expect(page.getByText(/AC-49\.3/).first()).toBeVisible();

    // Modal vẫn mở — quyết định chưa được thi hành.
    await expect(modal).toBeVisible();
  });

  test('phán quyết hợp lệ thì ghi nhận kết quả', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'moonkage_current_user',
        JSON.stringify({
          id: 'usr_admin',
          name: 'Quản trị viên Moonkage',
          email: 'operator@moonkage.vn',
          phone: '0901000999',
          role: 'ADMIN',
          nfcStatus: 'VERIFIED',
        }),
      );
    });

    await gotoRoute(page, '/quan-tri/khieu-nai');
    await waitForAppReady(page);

    await page.getByRole('button', { name: /Ra phán quyết giải quyết tranh chấp/i }).click();

    const modal = page.getByRole('dialog');
    await modal.getByLabel(/Số tiền hoàn trả/i).fill('135000');
    await modal.getByRole('button', { name: /Thi hành phán quyết/i }).click();

    // Thông báo thành công.
    await expect(page.getByText(/Đã phân xử khiếu nại/i).first()).toBeVisible();
  });
});
