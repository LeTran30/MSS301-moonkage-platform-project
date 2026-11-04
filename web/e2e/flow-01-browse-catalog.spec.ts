import { test, expect } from '@playwright/test';
import { gotoRoute, waitForAppReady, trackConsoleErrors, isIgnorableConsoleError } from './helpers';

/**
 * FLOW 1 — Mua lẻ (browse → catalog → chi tiết → giỏ hàng).
 *
 * Đây là hành trình phổ biến nhất, và là hành trình mà mọi thay đổi về danh
 * mục / bộ lọc / thẻ sản phẩm đều có thể làm hỏng.
 */
test.describe('FLOW 1 — Mua lẻ', () => {
  test('trang chủ hiện lời chào và lối vào danh mục', async ({ page }) => {
    await gotoRoute(page, '/');
    await waitForAppReady(page);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /Mua lẻ|danh mục/i }).first()).toBeVisible();
  });

  test('điều hướng từ trang chủ sang danh mục', async ({ page }) => {
    await gotoRoute(page, '/');
    await waitForAppReady(page);

    await page.getByRole('link', { name: /Mua lẻ|danh mục/i }).first().click();

    await expect(page).toHaveURL(/\/san-pham/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Bánh Trung Thu/i);
  });

  test('danh mục hiện sản phẩm và lọc theo vị nhân', async ({ page }) => {
    await gotoRoute(page, '/san-pham');
    await waitForAppReady(page);

    // Danh mục có sản phẩm (chế độ demo dùng MOCK_PRODUCTS).
    await expect(page.locator('article').first()).toBeVisible();

    const before = await page.locator('article').count();

    // Bật một chip lọc vị nhân.
    const chip = page.getByRole('button', { name: /Thập Cẩm/i }).first();
    if (await chip.isVisible()) {
      await chip.click();
      await expect(page.locator('article').first()).toBeVisible();
      // Lọc không được làm trang trắng.
      expect(await page.locator('article').count()).toBeGreaterThan(0);
      expect(await page.locator('article').count()).toBeLessThanOrEqual(before);
    }
  });

  test('mở được trang chi tiết sản phẩm từ danh mục', async ({ page }) => {
    await gotoRoute(page, '/san-pham');
    await waitForAppReady(page);

    await page.locator('article a').first().click();

    await expect(page).toHaveURL(/\/san-pham\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('trang sản phẩm không có lỗi console', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await gotoRoute(page, '/san-pham');
    await waitForAppReady(page);
    await page.waitForTimeout(500);

    const real = errors.filter((message) => !isIgnorableConsoleError(message));
    expect(real).toEqual([]);
  });
});
