import { test, expect } from '@playwright/test';
import { gotoRoute, login, waitForAppReady, SEED_VENDORS } from './helpers';

/**
 * FLOW 8 — Nhắn shop: người mua mở cuộc trò chuyện với một cửa hàng trước khi
 * mua, gửi tin và thấy tin của mình trong hộp thư.
 *
 * Chạy với backend thật: `member1` nhắn Shop seed Trăng Vàng. Cơ sở dữ liệu giữ
 * tin giữa các lần chạy, nên nội dung tin có dấu thời gian để test chỉ tìm
 * đúng tin vừa gửi.
 */
test('Nhắn shop mở cuộc trò chuyện và gửi được tin', async ({ page }) => {
  const text = `Shop còn bánh dẻo hạt sen không? (${Date.now()})`;

  await login(page);
  await gotoRoute(page, `/tai-khoan/tin-nhan?shop=${SEED_VENDORS.trangVang.id}`);
  await waitForAppReady(page);

  await expect(page.getByRole('heading', { level: 3, name: SEED_VENDORS.trangVang.name })).toBeVisible();
  await expect(page).toHaveURL(/\/tai-khoan\/tin-nhan$/);

  await page.getByLabel('Nội dung tin nhắn').fill(text);
  await page.getByRole('button', { name: 'Gửi' }).click();

  await expect(page.getByText(text).first()).toBeVisible();
  await expect(page.getByLabel('Nội dung tin nhắn')).toHaveValue('');
});
