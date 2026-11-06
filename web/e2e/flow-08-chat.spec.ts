import { test, expect, type Page, type Route } from '@playwright/test';
import { API_ORIGIN } from './apiStubs';
import { gotoRoute, waitForAppReady } from './helpers';

/**
 * FLOW 8 — Nhắn shop: người mua mở cuộc trò chuyện với một cửa hàng trước khi
 * mua, gửi tin và thấy tin của mình trong hộp thư. Máy chủ chat được giả lập.
 */
const CONVERSATION = {
  id: 'conv-1',
  vendorId: 'ven-1',
  vendorName: 'Tiệm Trăng Vàng',
  buyerAccountId: 'usr_lan',
  buyerName: 'Chị Lan',
  myParty: 'BUYER',
  lastMessage: null as unknown,
  lastMessageAt: null as string | null,
  unreadCount: 0,
};

async function stubChat(page: Page) {
  const messages: unknown[] = [];
  const ok = (route: Route, data: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ status, code: 'SUCCESS', message: 'OK', data, timestamp: '2026-11-06T10:00:00Z' }) });
  await page.route(`${API_ORIGIN}/order-service/api/chat/**`, async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (req.method() === 'POST' && path.endsWith('/chat/conversations')) return ok(route, CONVERSATION);
    if (req.method() === 'GET' && path.endsWith('/chat/conversations')) return ok(route, [CONVERSATION]);
    if (req.method() === 'GET' && path.endsWith('/conv-1')) {
      return ok(route, {
        conversationId: 'conv-1',
        myParty: 'BUYER',
        messages,
        buyerReadSeq: messages.length,
        vendorReadSeq: 0,
        hasMore: false,
      });
    }
    if (req.method() === 'POST' && path.endsWith('/messages')) {
      const body = req.postDataJSON() as { body: string };
      const message = {
        id: `m${messages.length + 1}`,
        seq: messages.length + 1,
        conversationId: 'conv-1',
        senderAccountId: 'usr_lan',
        senderParty: 'BUYER',
        body: body.body,
        attachmentName: null,
        attachmentContentType: null,
        attachmentUrl: null,
        createdAt: new Date().toISOString(),
      };
      messages.push(message);
      CONVERSATION.lastMessage = message;
      CONVERSATION.lastMessageAt = message.createdAt;
      return ok(route, message, 201);
    }
    return route.fulfill({ status: 204 });
  });
}

test('Nhắn shop mở cuộc trò chuyện và gửi được tin', async ({ page }) => {
  await gotoRoute(page, '/');
  await stubChat(page);
  await gotoRoute(page, '/tai-khoan/tin-nhan?shop=ven-1');
  await waitForAppReady(page);

  await expect(page.getByRole('heading', { name: 'Tiệm Trăng Vàng' })).toBeVisible();
  await page.getByLabel('Nội dung tin nhắn').fill('Shop còn bánh dẻo hạt sen không?');
  await page.getByRole('button', { name: 'Gửi' }).click();

  await expect(page.getByText('Shop còn bánh dẻo hạt sen không?').first()).toBeVisible();
  await expect(page).toHaveURL(/\/tai-khoan\/tin-nhan$/);
  await expect(page.getByLabel('Nội dung tin nhắn')).toHaveValue('');
});
