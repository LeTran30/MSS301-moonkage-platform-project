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
  waitFor,
  SEED_ACCOUNTS,
} from './helpers';
import { createVerifiedAccount, credentialsOf } from './accounts';
import {
  createNfcSession,
  encryptCardFields,
  freshIdNumber,
  nfcSessionStatus,
  nfcStatus,
  submitCard,
  submitRawCard,
  validCard,
} from './nfc';

/**
 * FLOW 6 — Xác minh danh tính NFC (M6.4, FR-04, AC-04.1 … AC-04.12).
 *
 * Luồng này là cổng chặn cho mọi giao dịch B2B và cho việc mở Shop. Test ở
 * đây kiểm tra **hợp đồng của giao diện** với ứng dụng di động (Moonkage
 * Verify, V1→V5) — đúng những gì backend dựa vào để đánh dấu tài khoản là
 * đã định danh.
 *
 * Trang này chỉ mở được khi đã đăng nhập (guard `RequireAuth`), nên test đăng
 * nhập bằng tài khoản seed thật. Không còn khung giả lập điện thoại: việc quét
 * thẻ là hành động của người dùng thật ngoài ứng dụng này.
 *
 * Persona: `member2@mk.com` — tài khoản **chưa** xác minh NFC. Tài khoản đã
 * định danh (`member1`) thấy màn "xác minh thành công", không có mã QR và
 * hướng dẫn 3 bước — nên phải dùng persona chưa định danh để kiểm tra phần
 * hướng dẫn.
 *
 * Phần **gửi thẻ thật** dùng JWE đúng chuẩn (RSA-OAEP-256 + A256GCM) mà
 * ứng dụng Verify sinh ra — xem `nfc.ts`. Server vẫn giải mã, vẫn kiểm tra
 * từng trường của thẻ (A-08), vẫn từ chối thẻ hết hạn, vẫn chặn một số CCCD
 * đã gắn với tài khoản khác. Chỉ có "đọc chip" là thao tác của con người ngoài
 * hệ thống mà thay bằng được.
 */
test.describe('FLOW 6 — Xác minh danh tính NFC', () => {
  /** Đăng nhập bằng persona chưa xác minh NFC. */
  async function loginWithoutNfc(page: Page) {
    await login(
      page,
      SEED_ACCOUNTS.buyerWithoutNfc.username,
      SEED_ACCOUNTS.buyerWithoutNfc.password,
    );
  }

  test('trang xác minh hiện QR, hướng dẫn 3 bước và trạng thái định danh', async ({ page }) => {
    await loginWithoutNfc(page);
    await gotoRoute(page, '/tai-khoan/xac-minh');
    await waitForAppReady(page);

    await expect(page.getByRole('heading', { level: 2 })).toContainText(/Xác thực căn cước/i);

    // Trạng thái định danh.
    await expect(page.getByText('CHƯA ĐỊNH DANH')).toBeVisible();

    // Hướng dẫn 3 bước.
    await expect(page.getByText(/Mở ứng dụng/i).first()).toBeVisible();
    await expect(page.getByText(/Quét mã QR/i).first()).toBeVisible();
    await expect(page.getByText(/Áp thẻ Căn cước công dân/i).first()).toBeVisible();
  });

  test('phiên xác minh có mã hiển thị và nút tạo mã QR mới', async ({ page }) => {
    await loginWithoutNfc(page);
    await gotoRoute(page, '/tai-khoan/xac-minh');
    await waitForAppReady(page);

    // Phiên được mở tự động khi tài khoản chưa định danh (AC-04.1).
    await expect(page.getByLabel('Mã phiên xác minh')).toBeVisible();
    await expect(page.getByRole('button', { name: /Tạo mã QR mới/i })).toBeVisible();
  });

  test('tạo mã QR mới thì phiên cũ bị thay thế', async ({ page }) => {
    await loginWithoutNfc(page);
    await gotoRoute(page, '/tai-khoan/xac-minh');
    await waitForAppReady(page);

    const code = page.getByLabel('Mã phiên xác minh');
    const first = (await code.textContent())?.trim();
    expect(first).toBeTruthy();

    await page.getByRole('button', { name: /Tạo mã QR mới/i }).click();

    // Mã mới khác mã cũ: phiên cũ của cùng tài khoản bị loại (Q-24).
    await expect
      .poll(async () => (await code.textContent())?.trim(), { timeout: 15_000 })
      .not.toBe(first);
  });

  test('tài khoản đã định danh thì hiện kết quả xác minh', async ({ page }) => {
    // `member1` đã định danh: trang hiện kết quả thành công, không có mã QR.
    await login(page);
    await gotoRoute(page, '/tai-khoan/xac-minh');
    await waitForAppReady(page);

    await expect(page.getByText('ĐÃ ĐỊNH DANH')).toBeVisible();
    await expect(page.getByText(/Tài khoản đã được xác minh thành công/i)).toBeVisible();
  });

  test('không còn khung giả lập điện thoại trong môi trường thật', async ({ page }) => {
    await loginWithoutNfc(page);
    await gotoRoute(page, '/tai-khoan/xac-minh');
    await waitForAppReady(page);

    // Khung giả lập chỉ có ý nghĩa khi thiết kế, không dùng trên production.
    await expect(page.getByText(/MÀN APP V\d/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Mở popup giả lập quét NFC/i })).toHaveCount(0);
  });

  test('trang xác minh không có lỗi console', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await loginWithoutNfc(page);
    await gotoRoute(page, '/tai-khoan/xac-minh');
    await waitForAppReady(page);
    await page.waitForTimeout(500);

    const real = errors.filter((message) => !isIgnorableConsoleError(message));
    expect(real).toEqual([]);
  });

  // ───────── phần server: gửi thẻ thật ─────────

  test('phiên xác minh mở ra chưa có dữ liệu cá nhân', async ({ page }) => {
    await loginWithoutNfc(page);

    const sessionId = await createNfcSession(page);
    expect(sessionId).toBeTruthy();

    // Mã phiên chỉ là mã ngẫu nhiên, không mang dữ liệu cá nhân (AC-04.1).
    expect(sessionId).not.toContain('079');
    expect(sessionId).not.toContain('member');

    const status = await nfcSessionStatus(page, sessionId);
    expect(status.status).toBe('PENDING');
  });

  test('gửi thẻ hợp lệ thì tài khoản chuyển sang đã định danh', async ({ page }) => {
    // Tài khoản **mới**: một lần đã định danh th��� không định danh lại được
    // (AC-04.1) ⇒ không dùng persona seed để test phần này.
    const fresh = await createVerifiedAccount('Nguyễn Thị Xác Minh');
    await loginAs(page, credentialsOf(fresh));

    const idNumber = freshIdNumber();
    const sessionId = await createNfcSession(page);

    const result = await submitCard(page, sessionId, validCard(), {
      idNumber,
      dateOfBirth: '1990-03-15',
      placeOfResidence: 'Ha Noi',
    });

    expect(result.status).toBe('VERIFIED');
    expect(result.reasonCode).toBeNull();

    // Phiên chuyển sang VERIFIED ⇒ web có thể đóng phiên mà không cần WebSocket.
    await waitFor(
      async () => (await nfcSessionStatus(page, sessionId)).status === 'VERIFIED',
      { timeout: 15_000 },
    );

    // Trạng thái định danh của tài khoản đã đổi, dữ liệu đã che (AC-04.11/12).
    const status = await nfcStatus(page);
    expect(status?.nfcStatus).toBe('VERIFIED');
    expect(status?.idNumberMasked).toBe('********' + idNumber.slice(-4));
    expect(status?.idNumberMasked).not.toContain(idNumber);
  });

  test('gửi thẻ hợp lệ thì trang web tự chuyển sang màn đã xác minh', async ({ page }) => {
    const fresh = await createVerifiedAccount('Nguyễn Văn Trang Xác Minh');
    await loginAs(page, credentialsOf(fresh));

    await gotoRoute(page, '/tai-khoan/xac-minh');
    await waitForAppReady(page);
    await expect(page.getByText('CHƯA ĐỊNH DANH')).toBeVisible();

    const sessionId = await createNfcSession(page);
    const result = await submitCard(page, sessionId, validCard(), {
      idNumber: freshIdNumber(),
      dateOfBirth: '1990-03-15',
      placeOfResidence: 'Ha Noi',
    });
    expect(result.status).toBe('VERIFIED');

    // Trang đang polling phiên (fallback khi WebSocket push bị lỡ) ⇒ tự cập
    // nhật màn "đã xác minh" mà không cần tải lại.
    await expect(page.getByText('ĐÃ ĐỊNH DANH')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Tài khoản đã được xác minh thành công/i)).toBeVisible();
  });

  test('thẻ sai định dạng thì bị từ chối và không định danh được (A-08)', async ({ page }) => {
    const fresh = await createVerifiedAccount('Nguyễn Thị Thẻ Sai');
    await loginAs(page, credentialsOf(fresh));

    const sessionId = await createNfcSession(page);
    const result = await submitCard(
      page,
      sessionId,
      // Tên có dấu: `^[A-Z]+( [A-Z]+)*$` không khớp ⇒ BAD_FORMAT.
      { ...validCard(), fullName: 'Nguyễn Thị Lan' },
      {
        idNumber: freshIdNumber(),
        dateOfBirth: '1990-03-15',
        placeOfResidence: 'Ha Noi',
      },
    );

    expect(result.status).toBe('REJECTED');
    expect(result.reasonCode).toBe('BAD_FORMAT');

    const status = await nfcStatus(page);
    expect(status?.nfcStatus).toBe('NOT_VERIFIED');
  });

  test('thẻ hết hạn thì bị từ chối (CARD_EXPIRED)', async ({ page }) => {
    const fresh = await createVerifiedAccount('Nguyễn Thị Thẻ Hết Hạn');
    await loginAs(page, credentialsOf(fresh));

    const sessionId = await createNfcSession(page);
    const result = await submitRawCard(
      page,
      sessionId,
      {
        fullName: 'NGUYEN THI LAN',
        gender: 'FEMALE',
        nationality: 'Việt Nam',
        placeOfBirth: 'Ha Noi',
        dateOfIssue: '2010-05-10',
        dateOfExpiry: '2015-05-10',
      },
      encryptCardFields({
        idNumber: freshIdNumber(),
        dateOfBirth: '1990-03-15',
        placeOfResidence: 'Ha Noi',
      }),
    );

    expect(result.status).toBe('REJECTED');
    expect(result.reasonCode).toBe('CARD_EXPIRED');

    const status = await nfcStatus(page);
    expect(status?.nfcStatus).toBe('NOT_VERIFIED');
  });

  test('số CCCD đã gắn với tài khoản khác thì bị chặn (BR-23)', async ({ page }) => {
    // Số CCCD của persona đã định danh (`member1`): đã có hồ sơ pháp lý.
    const usedIdNumber = '079190000001';

    const fresh = await createVerifiedAccount('Nguyễn Thị Trùng CCCD');
    await loginAs(page, credentialsOf(fresh));

    const sessionId = await createNfcSession(page);
    const result = await submitCard(page, sessionId, validCard(), {
      idNumber: usedIdNumber,
      dateOfBirth: '1990-03-15',
      placeOfResidence: 'Ha Noi',
    });

    expect(result.status).toBe('REJECTED');
    expect(result.reasonCode).toBe('ID_ALREADY_LINKED');

    const status = await nfcStatus(page);
    expect(status?.nfcStatus).toBe('NOT_VERIFIED');
  });

  test('phiên đã dùng thì không dùng lại được (SESSION_USED)', async ({ page }) => {
    const fresh = await createVerifiedAccount('Nguyễn Thị Dùng Lại Phiên');
    await loginAs(page, credentialsOf(fresh));

    const sessionId = await createNfcSession(page);
    const first = await submitCard(page, sessionId, validCard(), {
      idNumber: freshIdNumber(),
      dateOfBirth: '1990-03-15',
      placeOfResidence: 'Ha Noi',
    });
    expect(first.status).toBe('VERIFIED');

    // Dùng lại đúng phiên đó: tài khoản đã có hồ sơ pháp lý ⇒ SESSION_USED.
    const second = await submitCard(page, sessionId, validCard(), {
      idNumber: freshIdNumber(),
      dateOfBirth: '1990-03-15',
      placeOfResidence: 'Ha Noi',
    });
    expect(second.status).toBe('REJECTED');
    expect(second.reasonCode).toBe('SESSION_USED');
  });

  test('phiên của tài khoản khác thì không dùng được (SESSION_NOT_OWNED)', async ({ page }) => {
    const owner = await createVerifiedAccount('Chủ Phiên Xác Minh');
    await loginAs(page, credentialsOf(owner));
    const sessionId = await createNfcSession(page);

    // Tài khoản khác cố dùng phiên của chủ phiên.
    const other = await createVerifiedAccount('Kẻ Xâm Nhập Phiên');
    await loginAs(page, credentialsOf(other));

    const result = await submitCard(page, sessionId, validCard(), {
      idNumber: freshIdNumber(),
      dateOfBirth: '1990-03-15',
      placeOfResidence: 'Ha Noi',
    });

    expect(result.status).toBe('REJECTED');
    expect(result.reasonCode).toBe('SESSION_NOT_OWNED');
  });

  test('tài khoản đã định danh thì không mở được phiên mới (NFC_001)', async ({ page }) => {
    await loginAs(page, SEED_ACCOUNTS.buyer);

    let failed = false;
    let body = '';
    try {
      await apiPost(page, gatewayUrl('/api/nfc/sessions'), {});
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }

    expect(failed, 'Tài khoản đã định danh không được mở phiên xác minh mới.').toBe(true);
    expect(body).toContain('NFC_001');
  });

  test('quét sai nhiều lần thì bị khoá xác minh (AC-04.9)', async ({ page }) => {
    const fresh = await createVerifiedAccount('Nguyễn Thị Quét Sai');
    await loginAs(page, credentialsOf(fresh));

    // `NFC_MAX_ATTEMPTS` mặc định là 5: quét sai đủ số lần thì bị khoá. Lần
    // sai cuối cùng vẫn trả `BAD_FORMAT` nhưng `attemptsLeft = 0` — đó là lúc
    // tài khoản bị khoá (AC-04.9).
    let locked = false;
    let sessionId = '';
    for (let attempt = 0; attempt < 8 && !locked; attempt += 1) {
      sessionId = await createNfcSession(page);
      const result = await submitCard(
        page,
        sessionId,
        // Tên có dấu: `^[A-Z]+( [A-Z]+)*$` không khớp ⇒ BAD_FORMAT.
        { ...validCard(), fullName: 'Nguyễn Thị Lan' },
        {
          idNumber: freshIdNumber(),
          dateOfBirth: '1990-03-15',
          placeOfResidence: 'Ha Noi',
        },
      );
      expect(result.status).toBe('REJECTED');
      expect(result.reasonCode).toBe('BAD_FORMAT');
      locked = result.attemptsLeft === 0;
    }

    expect(locked, 'Quét sai đủ số lần thì phải bị khoá xác minh.').toBe(true);

    // Trong lúc bị khoá, mở phiên mới trả lỗi 429 (NFC_002).
    let failed = false;
    let body = '';
    try {
      await apiPost(page, gatewayUrl('/api/nfc/sessions'), {});
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }
    expect(failed, 'Trong lúc bị khoá thì không được mở phiên xác minh mới.').toBe(true);
    expect(body).toContain('NFC_002');

    // Gửi thẻ vào phiên đang có thì server trả mã `LOCKED` (AC-04.9).
    const lockedResult = await submitCard(page, sessionId, validCard(), {
      idNumber: freshIdNumber(),
      dateOfBirth: '1990-03-15',
      placeOfResidence: 'Ha Noi',
    });
    expect(lockedResult.status).toBe('REJECTED');
    expect(lockedResult.reasonCode).toBe('LOCKED');
    expect(lockedResult.lockedUntil).toBeTruthy();
  });

  test('trạng thái định danh của tài khoản đọc được qua API', async ({ page }) => {
    await loginAs(page, SEED_ACCOUNTS.buyerWithoutNfc);

    const payload = await apiGet<unknown>(page, gatewayUrl('/api/nfc/status'));
    const data = unwrapData<{ nfcStatus?: string }>(payload);
    expect(data?.nfcStatus).toBe('NOT_VERIFIED');
  });
});
