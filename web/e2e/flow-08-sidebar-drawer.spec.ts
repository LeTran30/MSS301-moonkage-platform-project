import { test, expect } from '@playwright/test';
import { login, SEED_ACCOUNTS, gotoRoute, waitForAppReady } from './helpers';

/**
 * Sidebar khu Vendor/Admin chuyển thành drawer trên màn hình hẹp (audit §3.3).
 *
 * Ở breakpoint `lg` trở xuống, sidebar dạng cột cố định bị ẩn và thay bằng
 * drawer trượt, theo đúng pattern của `HeaderMobileNav`: đóng bằng nút X,
 * bấm ra ngoài, phím Escape, hoặc bấm một mục (điều hướng sang trang khác).
 */
test.describe('Sidebar drawer trên mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('kênh quản trị: sidebar cột ẩn, nút mở drawer hoạt động', async ({ page }) => {
    await login(page, SEED_ACCOUNTS.admin.username, SEED_ACCOUNTS.admin.password);
    await gotoRoute(page, '/quan-tri');
    await waitForAppReady(page);

    // Sidebar cố định phải ẩn.
    const fixedSidebar = page.locator('aside[aria-label="Quản trị hệ thống"]');
    await expect(fixedSidebar).toBeHidden();

    // Nút mở drawer phải hiện.
    const trigger = page.getByRole('button', { name: /Mở menu quản trị/i });
    await expect(trigger).toBeVisible();

    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Quản trị' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('link', { name: /Tổng quan điều hành/ })).toBeVisible();

    // Escape đóng drawer.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    // Mở lại rồi bấm ra ngoài để đóng.
    await trigger.click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(370, 400);
    await expect(dialog).toBeHidden();
  });

  test('kênh người bán: drawer mở được và điều hướng đóng drawer', async ({ page }) => {
    await login(page, SEED_ACCOUNTS.vendor.username, SEED_ACCOUNTS.vendor.password);
    await gotoRoute(page, '/kenh-ban');
    await waitForAppReady(page);

    const fixedSidebar = page.locator('aside[aria-label="Kênh người bán"]');
    await expect(fixedSidebar).toBeHidden();

    const trigger = page.getByRole('button', { name: /Mở menu kênh người bán/i });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Kênh người bán' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('link', { name: /Tổng quan bán hàng/ })).toBeVisible();

    // Bấm một mục ⇒ điều hướng và drawer đóng.
    await dialog.getByRole('link', { name: /Quản lý sản phẩm/ }).click();
    await expect(dialog).toBeHidden();
  });

  test('màn hình rộng vẫn hiện sidebar cột cố định', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await login(page, SEED_ACCOUNTS.admin.username, SEED_ACCOUNTS.admin.password);
    await gotoRoute(page, '/quan-tri');
    await waitForAppReady(page);

    await expect(page.locator('aside[aria-label="Quản trị hệ thống"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Mở menu quản trị/i })).toBeHidden();
  });
});
