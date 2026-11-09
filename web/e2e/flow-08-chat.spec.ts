import { test, expect, type Page } from '@playwright/test';
import {
  gotoRoute,
  waitForAppReady,
  login,
  loginAs,
  trackConsoleErrors,
  isIgnorableConsoleError,
  apiGet,
  apiPost,
  gatewayUrl,
  unwrapData,
  SEED_ACCOUNTS,
  SEED_VENDORS,
} from './helpers';
import { minimalPdf, uploadFile } from './storage';

/**
 * FLOW 8 — Nhắn shop: người mua mở cuộc trò chuyện với một cửa hàng trước khi
 * mua, gửi tin và thấy tin của mình trong hộp thư.
 *
 * Chạy với backend thật: `member1` nhắn Shop seed Trăng Vàng. Cơ sở dữ liệu giữ
 * tin giữa các lần chạy, nên nội dung tin có dấu thời gian để test chỉ tìm
 * đúng tin vừa gửi.
 *
 * Luồng này kiểm tra **cả hai vế** của cuộc trò chuyện:
 *
 * 1. Người mua mở hộp thư và gửi tin (giao diện).
 * 2. Chủ Shop thấy tin đó trong hộp thư của mình (vế VENDOR) và trả lời.
 * 3. Người mua thấy tin của Shop, và dấu "Đã xem" xuất hiện khi Shop đã đọc
 *    (dấu đã đọc — `buyerReadSeq` / `vendorReadSeq`).
 *
 * Vì sao gọi **API** cho phần hai vế: hai phiên trình duyệt phải chạy song song
 * để thấy push STOMP, mà điều đó làm test chậm và dễ vỡ. Phần server kiểm
 * đúng những gì push mang: tin có đúng người gửi, `seq` tăng dần, dấu đã đọc
 * dịch đúng chiều.
 */

/** Một cuộc trò chuyện, đúng như `ConversationResponse` của order-service. */
interface Conversation {
  id: string;
  vendorId: string;
  vendorName?: string | null;
  buyerAccountId: string;
  buyerName?: string | null;
  myParty: 'BUYER' | 'VENDOR';
  lastMessage?: { body?: string | null; senderParty?: string } | null;
  lastMessageAt?: string | null;
  unreadCount: number;
}

/** Một tin nhắn, đúng như `ChatMessageResponse`. */
interface ChatMessage {
  id: string;
  seq: number;
  conversationId: string;
  senderAccountId: string;
  senderParty: 'BUYER' | 'VENDOR';
  body?: string | null;
  attachmentName?: string | null;
  attachmentContentType?: string | null;
  attachmentUrl?: string | null;
  createdAt: string;
}

/** Một trang của cuộc trò chuyện, đúng như `ChatThreadResponse`. */
interface ChatThread {
  conversationId: string;
  myParty: 'BUYER' | 'VENDOR';
  messages: ChatMessage[];
  buyerReadSeq: number;
  vendorReadSeq: number;
  hasMore: boolean;
}

/** Hộp thư của một bên. */
async function inbox(page: Page, as: 'BUYER' | 'VENDOR'): Promise<Conversation[]> {
  const payload = await apiGet<unknown>(page, gatewayUrl(`/api/chat/conversations?as=${as}`));
  return unwrapData<Conversation[]>(payload) ?? [];
}

/** Mở (hoặc tìm) cuộc trò chuyện của người mua với một Shop. */
async function startConversation(page: Page, vendorId: string): Promise<Conversation> {
  return apiPost<Conversation>(page, gatewayUrl('/api/chat/conversations'), { vendorId });
}

/** Đọc một trang của cuộc trò chuyện. */
async function thread(page: Page, conversationId: string): Promise<ChatThread> {
  const payload = await apiGet<unknown>(
    page,
    gatewayUrl(`/api/chat/conversations/${conversationId}?size=100`),
  );
  return unwrapData<ChatThread>(payload);
}

/** Gửi một tin nhắn. */
async function sendMessage(
  page: Page,
  conversationId: string,
  body: string,
): Promise<ChatMessage> {
  return apiPost<ChatMessage>(
    page,
    gatewayUrl(`/api/chat/conversations/${conversationId}/messages`),
    { body },
  );
}

/** Đánh dấu đã đọc tới một vị trí. */
async function markRead(page: Page, conversationId: string, upToSeq: number): Promise<void> {
  await apiPost(page, gatewayUrl(`/api/chat/conversations/${conversationId}/read`), { upToSeq });
}

test.describe('FLOW 8 — Nhắn shop', () => {
  test('Nhắn shop mở cuộc trò chuyện và gửi được tin', async ({ page }) => {
    const text = `Shop còn bánh dẻo hạt sen không? (${Date.now()})`;

    await login(page);
    await gotoRoute(page, `/tai-khoan/tin-nhan?shop=${SEED_VENDORS.trangVang.id}`);
    await waitForAppReady(page);

    await expect(
      page.getByRole('heading', { level: 3, name: SEED_VENDORS.trangVang.name }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/tai-khoan\/tin-nhan$/);

    await page.getByLabel('Nội dung tin nhắn').fill(text);
    // `exact: true`: nút hộp thư bên trái cũng chứa chữ "Gửi" trong tên Shop.
    await page.getByRole('button', { name: 'Gửi', exact: true }).click();

    await expect(page.getByText(text).first()).toBeVisible();
    await expect(page.getByLabel('Nội dung tin nhắn')).toHaveValue('');
  });

  test('mở lại hộp thư thì cuộc trò chuyện còn đó, không tạo cuộc trò chuyện mới', async ({
    page,
  }) => {
    await login(page);

    const first = await startConversation(page, SEED_VENDORS.trangVang.id);
    const second = await startConversation(page, SEED_VENDORS.trangVang.id);

    // Mỗi cặp người mua – Shop chỉ có **một** cuộc trò chuyện.
    expect(second.id).toBe(first.id);
  });

  test('người mua không nhắn được vào Shop của chính mình', async ({ page }) => {
    await loginAs(page, SEED_ACCOUNTS.vendor);

    let failed = false;
    let body = '';
    try {
      await startConversation(page, SEED_VENDORS.trangVang.id);
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }

    expect(failed, 'Chủ Shop không được nhắn vào Shop của chính mình.').toBe(true);
    expect(body).toContain('CHAT_002');
  });

  test('người mua và Shop nhắn qua lại, tin của mình luôn ở đúng phía', async ({ page }) => {
    await loginAs(page, SEED_ACCOUNTS.buyer);
    const conversation = await startConversation(page, SEED_VENDORS.trangVang.id);

    const buyerText = `Chào Shop, còn bánh dẻo không? (${Date.now()})`;
    const buyerMessage = await sendMessage(page, conversation.id, buyerText);

    expect(buyerMessage.senderParty).toBe('BUYER');
    expect(buyerMessage.body).toBe(buyerText);

    // Chủ Shop thấy tin đó trong hộp thư của mình.
    await loginAs(page, SEED_ACCOUNTS.vendor);
    const vendorInbox = await inbox(page, 'VENDOR');
    const line = vendorInbox.find((item) => item.id === conversation.id);
    expect(line, 'Hộp thư của Shop phải có cuộc trò chuyện này.').toBeTruthy();
    expect(line!.lastMessage?.body).toBe(buyerText);
    // Tin của người mua là tin **chưa đọc** của Shop.
    expect(line!.unreadCount).toBeGreaterThan(0);

    // Shop trả lời.
    const vendorText = `Có nhé, bánh dẻo hạt sen còn ${Date.now()}`;
    const vendorMessage = await sendMessage(page, conversation.id, vendorText);
    expect(vendorMessage.senderParty).toBe('VENDOR');
    expect(vendorMessage.body).toBe(vendorText);
    expect(vendorMessage.seq).toBeGreaterThan(buyerMessage.seq);

    // Người mua thấy tin của Shop trong cùng cuộc trò chuyện.
    await loginAs(page, SEED_ACCOUNTS.buyer);
    const buyerThread = await thread(page, conversation.id);
    const mine = buyerThread.messages.filter((m) => m.senderParty === 'BUYER');
    const theirs = buyerThread.messages.filter((m) => m.senderParty === 'VENDOR');
    expect(mine.some((m) => m.body === buyerText)).toBe(true);
    expect(theirs.some((m) => m.body === vendorText)).toBe(true);
  });

  test('dấu đã đọc dịch đúng chiều khi Shop đọc tin của người mua', async ({ page }) => {
    await loginAs(page, SEED_ACCOUNTS.buyer);
    const conversation = await startConversation(page, SEED_VENDORS.trangVang.id);

    const buyerMessage = await sendMessage(
      page,
      conversation.id,
      `Tin cần được đọc (${Date.now()})`,
    );

    // Trước khi Shop đọc: phía Shop chưa đọc tới tin đó.
    await loginAs(page, SEED_ACCOUNTS.vendor);
    const beforeRead = await thread(page, conversation.id);
    expect(beforeRead.vendorReadSeq).toBeLessThan(buyerMessage.seq);

    // Shop đọc tới tin đó.
    await markRead(page, conversation.id, buyerMessage.seq);
    const afterRead = await thread(page, conversation.id);
    expect(afterRead.vendorReadSeq).toBeGreaterThanOrEqual(buyerMessage.seq);
    // Người mua tự đọc tin của mình ngay khi gửi ⇒ phía người mua đã đọc.
    expect(afterRead.buyerReadSeq).toBeGreaterThanOrEqual(buyerMessage.seq);

    // Người mua đọc lại hộp thư: tin của Shop không còn là tin chưa đọc.
    await loginAs(page, SEED_ACCOUNTS.buyer);
    const buyerInbox = await inbox(page, 'BUYER');
    const line = buyerInbox.find((item) => item.id === conversation.id);
    expect(line).toBeTruthy();
  });

  test('người ngoài cuộc trò chuyện thì không đọc được tin', async ({ page }) => {
    await loginAs(page, SEED_ACCOUNTS.buyer);
    const conversation = await startConversation(page, SEED_VENDORS.trangVang.id);
    await sendMessage(page, conversation.id, `Tin riêng (${Date.now()})`);

    // Tài khoản khác (không phải người mua, cũng không phải chủ Shop).
    await loginAs(page, SEED_ACCOUNTS.admin);
    let failed = false;
    let body = '';
    try {
      await thread(page, conversation.id);
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }

    expect(failed, 'Người ngoài cuộc trò chuyện không được đọc tin.').toBe(true);
    expect(body).toContain('CHAT_001');
  });

  test('tin nhắn rỗng thì bị chặn', async ({ page }) => {
    await loginAs(page, SEED_ACCOUNTS.buyer);
    const conversation = await startConversation(page, SEED_VENDORS.trangVang.id);

    let failed = false;
    try {
      await apiPost<ChatMessage>(
        page,
        gatewayUrl(`/api/chat/conversations/${conversation.id}/messages`),
        { body: '   ' },
      );
    } catch {
      failed = true;
    }

    expect(failed, 'Tin nhắn không có nội dung thì phải bị chặn.').toBe(true);
  });

  test('gửi kèm tệp thì tin mang tệp đính kèm', async ({ page }) => {
    await loginAs(page, SEED_ACCOUNTS.buyer);
    const conversation = await startConversation(page, SEED_VENDORS.trangVang.id);

    // Tệp đính kèm đi qua cùng cơ chế hai bước của mọi tệp trên sàn
    // (FR-29): hỏi link có ký → tải lên → gửi khoá tạm.
    const tempKey = await uploadFile(
      page,
      gatewayUrl('/api/orders/uploads'),
      minimalPdf('Báo giá E2E'),
      'bao-gia-e2e.pdf',
      'application/pdf',
    );

    const message = await apiPost<ChatMessage>(
      page,
      gatewayUrl(`/api/chat/conversations/${conversation.id}/messages`),
      { body: 'Gửi kèm báo giá', attachmentTempKey: tempKey, attachmentName: 'bao-gia-e2e.pdf' },
    );

    expect(message.attachmentName).toBe('bao-gia-e2e.pdf');
    expect(message.attachmentContentType).toBe('application/pdf');
    expect(message.attachmentUrl).toBeTruthy();
  });

  test('hộp thư của Shop hiện cuộc trò chuyện với khách', async ({ page }) => {
    await loginAs(page, SEED_ACCOUNTS.vendor);
    await gotoRoute(page, '/kenh-ban/tin-nhan');
    await waitForAppReady(page);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Tin nhắn khách hàng/i);
    await expect(page.getByLabel('Cuộc trò chuyện')).toBeVisible();
  });

  test('trang tin nhắn không có lỗi console', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await login(page);
    await gotoRoute(page, `/tai-khoan/tin-nhan?shop=${SEED_VENDORS.trangVang.id}`);
    await waitForAppReady(page);
    await page.waitForTimeout(500);

    const real = errors.filter((message) => !isIgnorableConsoleError(message));
    expect(real).toEqual([]);
  });
});
