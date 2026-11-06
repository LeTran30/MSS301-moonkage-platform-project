/**
 * Chờ cho tới khi backend Moonkage **thực sự phục vụ được** qua API Gateway.
 *
 * Vì sao cần script này:
 *
 * - `/actuator/health` của gateway chỉ nói "gateway còn sống", **không** nói
 *   "mọi service đã đăng ký xong trong Eureka và đã định tuyến được". Gateway
 *   trả 200 cho health trong khi route nghiệp vụ vẫn trả `503 Service
 *   Unavailable` (`No servers available for service: ...` trong log gateway).
 * - Bộ E2E cần **mọi** service: danh mục (catalog), người bán (vendor), báo
 *   giá (quotation), đơn hàng (order), thanh toán (payment), thông báo
 *   (orchestrator) và tài khoản (identity).
 * - Nếu E2E chạy khi một service chưa sẵn sàng thì các test "trang ... không
 *   có lỗi console" đỏ vì `503` — lỗi **hạ tầng**, không phải lỗi sản
 *   phẩm. Và vì `503` xuất hiện ở console nên nó lẫn vào cùng mảng lỗi với
 *   lỗi CSP, khiến người đọc tưởng là lỗi CSP.
 *
 * Cách dùng:
 *   node scripts/wait-for-backend.mjs
 *
 * Biến môi trường:
 *   VITE_API_BASE_URL   gateway (mặc định http://localhost:8080)
 *   SEED_USERNAME       tài khoản seed để đăng nhập (mặc định admin@mk.com)
 *   SEED_PASSWORD       mật khẩu seed (mặc định 12345678 — `SEED_PASSWORD`
 *                       trong `.env.example` ở thư mục gốc)
 *   READY_TIMEOUT_MS    số ms tối đa để chờ (mặc định 300000 = 5 phút)
 *   READY_INTERVAL_MS   khoảng giữa hai lần thử (mặc định 5000)
 *
 * Script **không** nằm trong `npm run check` (nó cần backend đang chạy) —
 * CI gọi nó ở bước "Wait for the backend stack", trước khi chạy E2E.
 */

const BASE_URL = (process.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/+$/, '');
const USERNAME = process.env.SEED_USERNAME ?? 'admin@mk.com';
const PASSWORD = process.env.SEED_PASSWORD ?? '12345678';
const TIMEOUT_MS = Number(process.env.READY_TIMEOUT_MS ?? 300_000);
const INTERVAL_MS = Number(process.env.READY_INTERVAL_MS ?? 5_000);

/**
 * Một endpoint đại diện cho mỗi service mà E2E cần.
 *
 * Mọi endpoint đều **không** phải của gateway mà của service đích: đó là
 * điểm cần kiểm — lỗi 503 chỉ xuất hiện khi gateway định tuyến tới service
 * đã đăng ký trong Eureka.
 *
 * `admin` được dùng vì token của người mua không đọc được route của người
 * bán (403). Một token đọc được mọi service ⇒ một lần đăng nhập là đủ.
 */
const PROBES = [
  { service: 'identity-service', path: '/identity-service/api/accounts/me' },
  { service: 'catalog-service', path: '/api/products?provinceCode=01' },
  { service: 'vendor-service', path: '/api/cake-attributes' },
  { service: 'vendor-service (admin)', path: '/api/vendors?status=PENDING' },
  { service: 'quotation-service', path: '/quotation-service/api/suppliers?provinceCode=01' },
  { service: 'quotation-service (admin)', path: '/quotation-service/api/quote-requests' },
  { service: 'order-service', path: '/order-service/api/carts/me?provinceCode=01' },
  { service: 'payment-service', path: '/payment-service/api/payments' },
  { service: 'orchestrator-service', path: '/api/notifications' },
];

/**
 * `503` nghĩa là gateway chưa tìm thấy service ⇒ chưa sẵn sàng.
 *
 * Nhưng "chưa sẵn sàng" không chỉ có `503`: một service đang khởi động (drum
 * vừa mở cổng nhưng chưa xong migration/Hibernate) trả `500`. Vì vậy điều
 * kiện "sẵn sàng" là **mọi probe trả 2xx** — mọi mã khác (503, 500, 401, 404,
 * 0 = không có câu trả lời) đều nghĩa là chưa xong.
 */
const READY_STATUS_MIN = 200;
const READY_STATUS_MAX = 299;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchStatus(path, token) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    });
    // Cần đọc body để kết nối được giữ lại; nội dung không dùng.
    await response.arrayBuffer();
    return response.status;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Đăng nhập để lấy token.
 *
 * Chạy lại cho tới khi identity-service sẵn sàng: trước khi nó đăng ký
 * trong Eureka thì gateway trả 503 cho mọi request tới nó.
 */
async function login() {
  const response = await fetch(`${BASE_URL}/identity-service/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  if (!response.ok) return null;
  const body = await response.json();
  return body?.data?.token ?? null;
}

async function main() {
  const deadline = Date.now() + TIMEOUT_MS;
  let attempt = 0;

  while (Date.now() < deadline) {
    attempt += 1;

    const token = await login().catch(() => null);
    if (!token) {
      console.log(
        `[wait-for-backend] lần ${attempt}: chưa đăng nhập được (identity-service chưa sẵn sàng), thử lại sau ${INTERVAL_MS / 1000}s`,
      );
      await sleep(INTERVAL_MS);
      continue;
    }

    const results = [];
    for (const probe of PROBES) {
      const status = await fetchStatus(probe.path, token).catch(() => 0);
      results.push({ ...probe, status });
    }

    // Sẵn sàng = **mọi** probe trả 2xx. 503 (chưa đăng ký Eureka), 500
    // (service đang khởi động) và 0 (không có câu trả lời) đều là "chưa xong".
    const notReady = results.filter(
      (r) => r.status < READY_STATUS_MIN || r.status > READY_STATUS_MAX,
    );
    if (notReady.length === 0) {
      console.log(`[wait-for-backend] backend sẵn sàng sau ${attempt} lần thử.`);
      for (const r of results) console.log(`  ${r.status}  ${r.service}  ${r.path}`);
      return;
    }

    console.log(
      `[wait-for-backend] lần ${attempt}: ${notReady.length}/${PROBES.length} service chưa sẵn sàng ` +
        `(${notReady.map((r) => `${r.service}=${r.status || 'no-response'}`).join(', ')}) — thử lại sau ${INTERVAL_MS / 1000}s`,
    );
    await sleep(INTERVAL_MS);
  }

  console.error(
    `[wait-for-backend] FAIL: backend không sẵn sàng sau ${TIMEOUT_MS / 1000}s. ` +
      '503 nghĩa là service chưa đăng ký trong Eureka; 500 nghĩa là service đang khởi động.',
  );
  process.exit(1);
}

main().catch((error) => {
  console.error(`[wait-for-backend] FAIL: ${error?.message ?? error}`);
  process.exit(1);
});
