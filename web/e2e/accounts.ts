import { gatewayUrl } from './helpers';
// Nạp `.env` ở thư mục gốc vào `process.env` (biến sẵn có thắng).
//
// Vì sao cần: `RABBITMQ_USERNAME` / `RABBITMQ_PASSWORD` (để bắt OTP qua
// management API) nằm trong `.env` của stack backend ở thư mục gốc repo.
//
// Lưu ý: import này **phải** ở đây, không chỉ trong `nfc.ts` — mỗi module
// của test runner là một entrypoint riêng, nên module nào đọc `process.env`
// thì module đó phải tự kéo `env.ts` vào.
import './env';

/**
 * Tạo tài khoản **mới** cho test E2E và lấy mã OTP xác nhận email.
 *
 * Vì sao cần: một số luồng (F4 — đăng ký người bán, F6 — xác minh NFC) làm
 * thay đổi **vĩnh viễn** trạng thái của tài khoản: một lần đã định danh thì
 * không định danh lại được (AC-04.1), một lần đã có Shop thì không đăng ký
 * Shop thứ hai được (VENDOR_ALREADY_EXISTS). Nếu dùng tài khoản seed thì test
 * chỉ chạy được **một lần**; lần chạy thứ hai sẽ đỏ với lý do khó hiểu.
 *
 * Vì sao lấy OTP được: `identity-service` gửi mã qua RabbitMQ
 * (`orchestrator.email.identity`) rồi `orchestrator-service` gửi mail. Mã nằm
 * trong **payload của sự kiện**, nên test bắt được nó từ hàng đợi — không cần
 * đọc hộp thư. Đây là cầu nối giống hệt cầu nối IPN của VNPay: thay thế
 * phần "đọc email" mà môi trường local không làm được, còn lại server vẫn
 * kiểm tra mã thật.
 */

/** Hàng đợi tạm để bắt sự kiện email; tự hủy khi hết hạn (TTL ��ây). */
const OTP_QUEUE = 'moonkage.e2e.otp';

/** Mật khẩu của tài khoản tạo trong test — không phải mật khẩu seed. */
export const E2E_PASSWORD = 'E2e@12345678';

/** Một tài khoản vừa tạo, đã xác nhận email. */
export interface FreshAccount {
  id: string;
  email: string;
  password: string;
  fullName: string;
}

/** Thông tin đăng nhập (dùng cho `loginAs`). */
export interface Credentials {
  username: string;
  password: string;
}

/** Hàng đợi bắt OTP có sẵn chưa. */
function rabbitManagementUrl(pathname: string): string {
  const host = process.env.RABBITMQ_HOST ?? 'localhost';
  const port = process.env.RABBITMQ_MANAGEMENT_PORT ?? '15672';
  return `http://${host}:${port}/api${pathname}`;
}

/** Header xác thực của RabbitMQ management API. */
function rabbitAuthHeader(): Record<string, string> {
  const username = process.env.RABBITMQ_USERNAME;
  const password = process.env.RABBITMQ_PASSWORD;
  if (!username || !password) {
    throw new Error(
      'Thiếu RABBITMQ_USERNAME / RABBITMQ_PASSWORD: không bắt được mã OTP xác nhận email. ' +
        'Xem .env ở thư mục gốc.',
    );
  }
  return {
    Authorization: `Basic ${Buffer.from(`${username}:${password}`, 'utf8').toString('base64')}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Bảo đảm hàng đợi bắt OTP tồn tại và được gắn vào sự kiện email.
 *
 * Hàng đợi bị khai báo **bởi test** (không phải bởi orchestrator-service) nên
 * nó tự hủy khi hết hạn — không để lại rác trong broker sau khi test kết thúc.
 */
async function ensureOtpQueue(): Promise<void> {
  const headers = rabbitAuthHeader();

  await fetch(rabbitManagementUrl(`/queues/%2F/${encodeURIComponent(OTP_QUEUE)}`), {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      auto_delete: false,
      durable: true,
      expires: '600000',
    }),
  });

  await fetch(
    rabbitManagementUrl('/bindings/%2F/e/moonkage.events/q/' + encodeURIComponent(OTP_QUEUE)),
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ routing_key: 'orchestrator.email.#', arguments: {} }),
    },
  );
}

/**
 * Dọn hết mã OTP cũ trong hàng đợi.
 *
 * Vì sao cần: hàng đợi là của **cả** các lần chạy test, nên nó dồn lên. API
 * `/get` của RabbitMQ trả về các message **đầu tiên** theo thứ tự, nên khi
 * hàng đợi đã có hơn 20 mã thì mã vừa gửi (nằm ở cuối) không bao giờ lọt
 * vào kết quả đọc ⇒ test chờ mãi rồi báo "không nhận được OTP".
 *
 * Dọn trước mỗi lần đăng ký giải quyết đúng chỗ đó: lúc đó hàng đợi chỉ
 * có mã của tài khoản đang tạo.
 */
async function purgeOtpQueue(): Promise<void> {
  const response = await fetch(
    rabbitManagementUrl(`/queues/%2F/${encodeURIComponent(OTP_QUEUE)}/contents`),
    { method: 'DELETE', headers: rabbitAuthHeader() },
  );
  if (!response.ok && response.status !== 404) {
    throw new Error(
      `Không dọn được hàng đợi OTP: ${response.status} ${await response.text()}`,
    );
  }
}

/** Một sự kiện email đã bắt được. */
interface CapturedEmail {
  to: string;
  templateCode: string;
  otp: string;
}

/**
 * Đọc các sự kiện email đang chờ trong hàng đợi.
 *
 * Dùng `ack_requeue_true` để **không** bỏ mất sự kiện: một lần đọc rỗng (mã
 * chưa tới) không làm mất mã.
 */
async function readCapturedEmails(): Promise<CapturedEmail[]> {
  const response = await fetch(
    rabbitManagementUrl(`/queues/%2F/${encodeURIComponent(OTP_QUEUE)}/get`),
    {
      method: 'POST',
      headers: rabbitAuthHeader(),
      body: JSON.stringify({ count: 20, ackmode: 'ack_requeue_true', encoding: 'auto' }),
    },
  );
  if (!response.ok) {
    throw new Error(`RabbitMQ management API: ${response.status} ${await response.text()}`);
  }

  const messages = (await response.json()) as Array<{
    payload: string;
    payload_encoding: string;
  }>;

  const emails: CapturedEmail[] = [];
  for (const message of messages) {
    const raw =
      message.payload_encoding === 'string'
        ? message.payload
        : Buffer.from(message.payload, 'base64').toString('utf8');
    try {
      const event = JSON.parse(raw) as {
        to?: string;
        templateCode?: string;
        params?: { otp?: string };
      };
      if (event.templateCode === 'REGISTRATION' && event.params?.otp) {
        emails.push({
          to: event.to ?? '',
          templateCode: event.templateCode,
          otp: event.params.otp,
        });
      }
    } catch {
      /* không phải JSON: bỏ qua, sự kiện khác trong hàng đợi */
    }
  }
  return emails;
}

/**
 * Chờ mã OTP của một địa chỉ email xuất hiện trong hàng đợi.
 *
 * @param email địa chỉ cần mã
 * @param timeout số mili giây chờ tối đa
 */
export async function waitForRegistrationOtp(email: string, timeout = 20_000): Promise<string> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const emails = await readCapturedEmails();
    const match = emails.find((item) => item.to === email);
    if (match) return match.otp;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Không nhận được mã OTP cho ${email} trong ${timeout}ms.`);
}

/**
 * Đăng ký một tài khoản mới và xác nhận email bằng mã OTP thật.
 *
 * @param fullName tên hiển thị của tài khoản
 * @returns tài khoản đã xác nhận, dùng được ngay
 */
export async function createVerifiedAccount(fullName = 'Người Dùng E2E'): Promise<FreshAccount> {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  // Miền `mk.com` bị orchestrator chặn gửi mail thật ⇒ mã OTP chỉ nằm trong
  // sự kiện RabbitMQ, không gửi đi đâu cả.
  const email = `e2e.${stamp}@mk.com`;

  await ensureOtpQueue();
  // Dọn mã cũ trước khi đăng ký: nếu không, mã mới (nằm cuối hàng đợi) có thể
  // không bao giờ được đọc ra.
  await purgeOtpQueue();

  const registerResponse = await fetch(gatewayUrl('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: E2E_PASSWORD, fullName }),
  });
  if (!registerResponse.ok) {
    throw new Error(
      `POST /api/auth/register -> ${registerResponse.status}: ${(await registerResponse.text()).slice(0, 300)}`,
    );
  }

  const otp = await waitForRegistrationOtp(email);

  const verifyResponse = await fetch(gatewayUrl('/api/auth/verify-account'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  if (!verifyResponse.ok) {
    throw new Error(
      `POST /api/auth/verify-account -> ${verifyResponse.status}: ${(await verifyResponse.text()).slice(0, 300)}`,
    );
  }

  const registered = (await registerResponse.json()) as { data?: { id?: string } };

  return {
    id: registered.data?.id ?? '',
    email,
    password: E2E_PASSWORD,
    fullName,
  };
}

/** Thông tin đăng nhập của một tài khoản vừa tạo. */
export function credentialsOf(account: FreshAccount): Credentials {
  return { username: account.email, password: account.password };
}

/**
 * Bảo đảm broker RabbitMQ có cấu hình để bắt sự kiện email.
 *
 * Chỉ để báo lỗi sớm, dễ hiểu, thay vì lỗi HTTP 401 từ RabbitMQ.
 */
export function assertRabbitConfigured(): void {
  if (!process.env.RABBITMQ_USERNAME || !process.env.RABBITMQ_PASSWORD) {
    throw new Error(
      'Thiếu RABBITMQ_USERNAME / RABBITMQ_PASSWORD trong .env ở thư mục gốc: ' +
        'không lấy được mã OTP xác nhận email.',
    );
  }
}
