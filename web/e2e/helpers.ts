import { expect, type Page } from '@playwright/test';

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

/** Tài khoản seed của `identity-service` (docs/guides/database.md). */
export const SEED_ACCOUNTS = {
  admin: { username: 'admin@mk.com', password: '12345678' },
  buyer: { username: 'member1@mk.com', password: '12345678' },
  /**
   * Tài khoản **chưa** xác minh NFC.
   *
   * `member1` đã định danh, nên trang xác minh hiện kết quả thành công chứ không
   * hiện mã QR + hướng dẫn 3 bước. Muốn kiểm tra phần hướng dẫn thì phải dùng
   * persona chưa định danh (`member2`).
   */
  buyerWithoutNfc: { username: 'member2@mk.com', password: '12345678' },
  /**
   * Tài khoản đã duyệt làm người bán và đã đóng phí mở bán: đủ quyền vào
   * kênh quản lý bán hàng.
   */
  vendor: { username: 'member4@mk.com', password: '12345678' },
} as const;

/** Shop seed của `vendor-service` (sổ ID, docs/guides/database.md). */
export const SEED_VENDORS = {
  /** Trăng Vàng của member4: đã duyệt, đang bán. */
  trangVang: { id: '00000000-0000-4000-8000-000200000001', name: /Trăng Vàng/ },
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
  username = SEED_ACCOUNTS.buyer.username,
  password = SEED_ACCOUNTS.buyer.password,
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
 * Đường dẫn tuyệt đối tới một endpoint của gateway.
 *
 * `VITE_API_BASE_URL` được nhúng lúc build nên test đọc được đúng gateway mà
 * ứng dụng đang dùng, không hardcode cổng.
 */
export function gatewayUrl(path: string): string {
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
