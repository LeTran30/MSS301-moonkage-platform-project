import { expect, type Page } from '@playwright/test';
// Nạp `.env` ở thư mục gốc vào `process.env` (biến sẵn có thắng).
//
// Vì sao cần: `SEED_PASSWORD` (mật khẩu của các tài khoản seed) nằm trong
// `.env` của stack backend ở thư mục gốc repo. `web/.env` là file cục bộ của
// developer (gitignore) nên CI checkout sạch không có — mà test lại đọc
// `process.env.SEED_PASSWORD` ngay ở dòng dưới. Không nạp `.env` thì mọi test
// đăng nhập dùng mật khẩu mặc định và đỏ khi seed đã đổi.
//
// Lưu ý: import này **phải** ở đây, không chỉ trong `nfc.ts` — mỗi module
// của test runner là một entrypoint riêng, nên module nào đọc `process.env`
// thì module đó phải tự kéo `env.ts` vào.
import './env';

/**
 * Tiện ích dùng chung cho các test E2E.
 *
 * E2E chạy ứng dụng thật với backend Moonkage đang chạy (docker compose up),
 * nên dữ liệu đến từ API Gateway. Test vì vậy tập trung vào **hành trình
 * người dùng** và **contract của giao diện** (route, nhãn, trạng thái).
 *
 * Không còn dữ liệu mô phỏng: mọi phiên đăng nhập đều đi qua API thật với
 * tài khoản seed của `identity-service` (docs/guides/database.md).
 */

/**
 * Tài khoản seed của `identity-service` (docs/guides/database.md).
 *
 * Mật khẩu chung là `SEED_PASSWORD` trong `.env` ở thư mục gốc; mặc định
 * `12345678` khớp với `.env.example`. Đổi seed password thì đổi cả ở đây —
 * nếu không, mọi test đăng nhập sẽ đỏ với lý do "sai mật khẩu".
 */
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? '12345678';

export const SEED_ACCOUNTS = {
  admin: { username: 'admin@mk.com', password: SEED_PASSWORD },
  /** Người mua đã định danh NFC — dùng cho mọi luồng cần hồ sơ pháp lý. */
  buyer: { username: 'member1@mk.com', password: SEED_PASSWORD },
  /**
   * Tài khoản **chưa** xác minh NFC.
   *
   * `member1` đã định danh, nên trang xác minh hiện kết quả thành công chứ không
   * hiện mã QR + hướng dẫn 3 bước. Muốn kiểm tra phần hướng dẫn thì phải dùng
   * persona chưa định danh (`member2`).
   */
  buyerWithoutNfc: { username: 'member2@mk.com', password: SEED_PASSWORD },
  /**
   * Chủ Shop Trăng Vàng: đã duyệt, đã đóng phí mở bán, nhận đơn riêng và bán
   * lẻ. Đây là Shop mặc định của mọi luồng cần một Shop hoạt động.
   */
  vendor: { username: 'member4@mk.com', password: SEED_PASSWORD },
  /**
   * Chủ Shop Nhà Mây: cũng đã duyệt và đã đóng phí, nhận đơn riêng, bán lẻ.
   *
   * Dùng khi một test cần **hai Shop khác nhau** cùng báo giá — ví dụ F2: yêu
   * cầu mở, hai Shop cạnh tranh nhau trả giá.
   *
   * Lưu ý: đừng lấy nhầm `member7` (Shop Cô Ba, `000200000004`) — Shop đó
   * `accepts_orders = false` nên **không** báo giá được cho yêu cầu nào.
   */
  vendorSecond: { username: 'member9@mk.com', password: SEED_PASSWORD },
  /**
   * Chủ Shop Chợ Lớn: `accepts_orders = true` nhưng chỉ làm `CARD` và `STICKER`
   * (không làm `BAG`) — dùng làm Shop **không được mời** trong F3.
   */
  vendorThird: { username: 'member6@mk.com', password: SEED_PASSWORD },
  /**
   * Tài khoản **chưa** có gian hàng — dùng để kiểm tra lối vào kênh người bán
   * và hồ sơ đăng ký người bán (F4).
   */
  plainMember: { username: 'member10@mk.com', password: SEED_PASSWORD },
} as const;

/**
 * Shop seed của `vendor-service` (sổ ID, docs/guides/database.md).
 *
 * `trangVang` (member4) là Shop đã duyệt, đang bán, giao ở tỉnh 79 (TP.HCM) —
 * dùng cho mọi luồng cần một Shop hoạt động.
 *
 * `nhaMay` (member9) là Shop thứ hai, cũng ở tỉnh 79 và nhận đơn riêng — dùng
 * khi cần hai Shop cạnh tranh nhau trong cùng một luồng.
 *
 * `choLon` (member6) là Shop thứ ba: nhận đơn riêng nhưng **không** làm bao bì
 * `BAG`, nên không được mời vào một yêu cầu riêng hỏi bao bì `BAG`.
 */
export const SEED_VENDORS = {
  /** Trăng Vàng của member4: đã duyệt, đang bán, làm BAG/CARD/STICKER. */
  trangVang: { id: '00000000-0000-4000-8000-000200000001', name: /Trăng Vàng/ },
  /** Nhà Mây của member9: đã duyệt, đang bán, làm BAG/CARD. */
  nhaMay: { id: '00000000-0000-4000-8000-000200000006', name: /Nhà Mây/ },
  /** Chợ Lớn của member6: đã duyệt, nhận đơn riêng, chỉ làm CARD/STICKER. */
  choLon: { id: '00000000-0000-4000-8000-000200000003', name: /Chợ Lớn/ },
} as const;

/** Điều hướng tới một route của ứng dụng và chờ trang render xong. */
export async function gotoRoute(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.locator('#root')).toBeVisible();
}

/**
 * Chờ ứng dụng sẵn sàng (React đã render xong lần đầu).
 *
 * `data-app-ready` được đặt trong `AppProviders` khi effect chạy.
 */
export async function waitForAppReady(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
}

/**
 * Đăng nhập bằng form (tài khoản seed của identity-service).
 *
 * Chờ tới trang tài khoản để chắc chắn phiên đã được mở thật: `login` trả
 * token, `SessionBridge` nạp hồ sơ, rồi router chuyển hướng.
 */
export async function login(
  page: Page,
  username: string = SEED_ACCOUNTS.buyer.username,
  password: string = SEED_ACCOUNTS.buyer.password,
): Promise<void> {
  await gotoRoute(page, '/dang-nhap');
  await waitForAppReady(page);

  await page.getByLabel('Email hoặc số điện thoại').fill(username);
  await page.getByLabel('Mật khẩu').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  await page.waitForURL(/\/tai-khoan/, { timeout: 15_000 });
}

/**
 * Gọi API Gateway **từ trong trang**, dùng đúng token của phiên đang mở.
 *
 * Test cần dữ liệu thật (mã đơn hàng, danh sách khiếu nại) để chọn đúng
 * đối tượng kiểm thử — không hardcode mã đơn vì mã đó do backend sinh ra.
 *
 * Đường dẫn phải là **đường dẫn tuyệt đối** của gateway. Đường dẫn tương
 * đối sẽ bị `vite preview` trả về `index.html` (SPA fallback) và `JSON.parse`
 * sẽ vấp `<!doctype ...`.
 */
export async function apiGet<T = unknown>(page: Page, path: string): Promise<T> {
  return page.evaluate(async (target) => {
    const raw = sessionStorage.getItem('moonkage_session_tokens');
    const token = raw ? (JSON.parse(raw) as { accessToken?: string }).accessToken : undefined;

    const response = await fetch(target, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`GET ${target} -> ${response.status}: ${text.slice(0, 300)}`);
    }
    return text ? JSON.parse(text) : null;
  }, path);
}

/**
 * Như `apiGet`, nhưng trả về `null` khi tài nguyên không tồn tại (404).
 *
 * Dùng cho dữ liệu có thể chưa có, ví dụ khiếu nại của một đơn: test bỏ qua
 * nhánh đó thay vì hỏng.
 */
export async function apiGetIfExists<T = unknown>(page: Page, path: string): Promise<T | null> {
  try {
    return await apiGet<T>(page, path);
  } catch (error) {
    if (error instanceof Error && error.message.includes(' -> 404:')) return null;
    throw error;
  }
}

/**
 * Gọi API Gateway **từ trong trang** với một method bất kỳ.
 *
 * Vì sao không gọi trực tiếp từ Node: trang đang mở đã có token trong
 * `sessionStorage` và CSP cho phép đúng origin của gateway. Gọi trong trang
 * thì không phải lo về CSP lẫn về việc lấy token.
 *
 * @param method `GET`, `POST`, `PATCH`, `PUT`, `DELETE`
 * @param path đường dẫn tuyệt đối của gateway
 * @param body thân của yêu cầu; `undefined` = không có thân
 */
export async function apiRequest<T = unknown>(
  page: Page,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  return page.evaluate(
    async ({ target, verb, payload }) => {
      const raw = sessionStorage.getItem('moonkage_session_tokens');
      const token = raw ? (JSON.parse(raw) as { accessToken?: string }).accessToken : undefined;

      const response = await fetch(target, {
        method: verb,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(payload === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: payload === undefined ? undefined : JSON.stringify(payload),
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`${verb} ${target} -> ${response.status}: ${text.slice(0, 400)}`);
      }
      return text ? JSON.parse(text) : null;
    },
    { target: path, verb: method, payload: body ?? null },
  );
}

/** `POST` tới gateway, trả về phần `data` của envelope. */
export async function apiPost<T = unknown>(
  page: Page,
  path: string,
  body?: unknown,
): Promise<T> {
  const payload = await apiRequest<unknown>(page, 'POST', path, body);
  return unwrapData<T>(payload);
}

/** `PATCH` tới gateway, trả về phần `data` của envelope. */
export async function apiPatch<T = unknown>(
  page: Page,
  path: string,
  body?: unknown,
): Promise<T> {
  const payload = await apiRequest<unknown>(page, 'PATCH', path, body);
  return unwrapData<T>(payload);
}

/** `PUT` tới gateway, trả về phần `data` của envelope. */
export async function apiPut<T = unknown>(page: Page, path: string, body?: unknown): Promise<T> {
  const payload = await apiRequest<unknown>(page, 'PUT', path, body);
  return unwrapData<T>(payload);
}

/** `DELETE` tới gateway. */
export async function apiDelete(page: Page, path: string): Promise<void> {
  await apiRequest<unknown>(page, 'DELETE', path);
}

/**
 * Đăng nhập bằng API rồi **bơm token** vào `sessionStorage` của trang.
 *
 * Vì sao cần: một số luồng dài (F1, F2, F3) phải đổi vai — người mua, Shop,
 * admin — và mỗi lần đổi vai thì đi qua form đăng nhập là chậm và dễ vỡ.
 * Đăng nhập bằng API rồi chỉ cần bơm token là nhanh và ổn định.
 *
 * Token được bơm đúng vào khoá mà ứng dụng đọc (`tokenVault`), nên `SessionBridge`
 * nhận ra phiên và tải hồ sơ như bình thường.
 *
 * @param account tài khoản seed; mặc định là người mua
 */
export async function loginAs(
  page: Page,
  account: { username: string; password: string } = SEED_ACCOUNTS.buyer,
): Promise<void> {
  // Phải ở trong origin của ứng dụng thì `sessionStorage` mới đọc được —
  // ở `about:blank` thì trình duyệt trả "Access is denied".
  await page.goto('/');
  await expect(page.locator('#root')).toBeVisible();

  const response = await page.evaluate(
    async ({ username, password, loginUrl }) => {
      const raw = sessionStorage.getItem('moonkage_session_tokens');
      const token = raw ? (JSON.parse(raw) as { accessToken?: string }).accessToken : undefined;

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ username, password }),
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`POST ${loginUrl} -> ${response.status}: ${text.slice(0, 300)}`);
      }
      return JSON.parse(text);
    },
    { ...account, loginUrl: gatewayUrl('/api/auth/login') },
  );

  const data = (response as { data?: { token?: string; refreshToken?: string } }).data;
  if (!data?.token) {
    throw new Error('Đăng nhập trả về không có token.');
  }

  await page.evaluate((tokens) => {
    sessionStorage.setItem('moonkage_session_tokens', JSON.stringify(tokens));
  }, { accessToken: data.token, refreshToken: data.refreshToken ?? null });

  // Đợi ứng dụng nhận ra phiên: nó đọc token và tải hồ sơ.
  await page.goto('/tai-khoan');
  await waitForAppReady(page);
}

/**
 * Chờ cho tới khi một điều kiện trên API trở thành đúng.
 *
 * Vì sao cần: mọi việc trong hệ thống này đi qua message bus (RabbitMQ) —
 * thanh toán thành công thì order-service nhận `payment.succeeded` ở một
 * service khác và mất một khoảnh thời gian để tạo đơn. Test phải **chờ**
 * trạng thái đó, không được giả định nó xảy ra tức thì.
 *
 * @param check hàm trả về giá trị **đúng** khi điều kiện đã xảy ra (thường là
 *   đối tượng đọc được, hoặc `null` khi chưa đúng)
 * @param timeout số mili giây chờ tối đa
 * @param interval khoảng giữa hai lần thử
 */
export async function waitFor(
  check: () => Promise<unknown>,
  { timeout = 20_000, interval = 500 }: { timeout?: number; interval?: number } = {},
): Promise<void> {
  const deadline = Date.now() + timeout;
  let lastError: unknown = null;
  while (Date.now() < deadline) {
    try {
      const result = await check();
      if (result) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(
    `Điều kiện không xảy ra trong ${timeout}ms.` +
      (lastError instanceof Error ? ` Lỗi cuối: ${lastError.message}` : ''),
  );
}

/**
 * Đường dẫn tuyệt đối tới một endpoint của gateway.
 *
 * `VITE_API_BASE_URL` được nhúng lúc build nên test đọc được đúng gateway mà
 * ứng dụng đang dùng, không hardcode cổng.
 *
 * Hàm này **idempotent**: URL đã là tuyệt đối thì trả về nguyên. Nhờ vậy
 * gọi `gatewayUrl(gatewayUrl(path))` không sinh ra
 * `http://host:8080http://host:8080/api/...` — một URL hỏng khiến `fetch`
 * chết với "Failed to fetch" và lỗi đó rất khó đoán.
 */
export function gatewayUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  const base =
    (process.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/+$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Bóc mảng `data` (envelope của backend) ra khỏi câu trả lời. */
export function unwrapData<T>(payload: unknown): T {
  const body = payload as { data?: T } | T;
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

/**
 * Mã đơn hàng đầu tiên của tài khoản đang đăng nhập, đọc từ API thật.
 *
 * Trả về `null` khi tài khoản chưa có đơn nào — test gọn thì bỏ qua nhánh
 * đó thay vì đoán mã.
 */
export async function firstOrderId(page: Page): Promise<string | null> {
  const payload = await apiGet<unknown>(page, gatewayUrl('/api/orders?size=20'));
  const data = unwrapData<{ content?: Array<{ id?: string }> }>(payload);
  const first = data?.content?.[0]?.id;
  return first ?? null;
}

/**
 * Chọn một mục trong `Select` của design system.
 *
 * `Select` là listbox tự dựng (không phải `<select>` native) nên không dùng
 * được `selectOption()` của Playwright. Helper này mở dropdown, bấm vào option
 * tương ứng rồi đóng lại — đúng như người dùng thao tác.
 */
export async function selectOptionByLabel(page: Page, label: string, optionText: string): Promise<void> {
  const trigger = page.getByLabel(label);
  await trigger.click();
  await page.getByRole('option', { name: optionText }).click();
  await expect(trigger).toContainText(optionText);
}

/** Kiểm tra không có lỗi trong console — bắt lỗi runtime mà test khác bỏ sót. */
export function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  return errors;
}

/** Bỏ qua các lỗi console đã biết là không liên quan (vd: font bị chặn). */
export function isIgnorableConsoleError(message: string): boolean {
  return (
    message.includes('Failed to load resource') &&
    (message.includes('fonts.googleapis.com') || message.includes('favicon'))
  );
}
