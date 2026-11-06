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

  test('danh mục hiện sản phẩm của máy chủ và lọc theo vị nhân', async ({ page }) => {
    await gotoRoute(page, '/san-pham');
    await waitForAppReady(page);

    // Hai sản phẩm `catalog-service` trả về (apiStubs.ts), không còn dữ liệu mock.
    const cards = page.locator('article');
    await expect(cards.filter({ hasText: 'Bánh nướng thập cẩm gà quay' })).toBeVisible();
    await expect(cards.filter({ hasText: 'Bánh dẻo đậu xanh' })).toBeVisible();

    // Lọc theo nhân Thập cẩm: chỉ còn sản phẩm thập cẩm.
    await page.getByRole('button', { name: /Thập cẩm/i }).first().click();
    await expect(cards.filter({ hasText: 'Bánh nướng thập cẩm gà quay' })).toBeVisible();
    await expect(cards.filter({ hasText: 'Bánh dẻo đậu xanh' })).toHaveCount(0);
  });

  test('mở được trang chi tiết sản phẩm từ danh mục', async ({ page }) => {
    await gotoRoute(page, '/san-pham');
    await waitForAppReady(page);

    await page.locator('article', { hasText: 'Bánh nướng thập cẩm gà quay' }).locator('a').first().click();

    await expect(page).toHaveURL(/\/san-pham\/p-thap-cam$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Bánh nướng thập cẩm gà quay');
    // Nhãn giao và tên vỏ bánh lấy từ dữ liệu máy chủ (NATIONWIDE, banh-nuong).
    await expect(page.getByText('Giao toàn quốc').first()).toBeVisible();
    await expect(page.getByText(/Vỏ bánh:\s*Bánh nướng/)).toBeVisible();
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
