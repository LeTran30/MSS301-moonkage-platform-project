/* eslint-disable no-console */
/**
 * Đối chiếu hằng đường dẫn viết tay trong `shared/api/gateway.ts` với hợp đồng
 * OpenAPI đã sinh (`shared/api/generated/openapi.json`).
 *
 * Vì sao cần (C-3 trong `docs/work/plans/debt-implementation-plan.md`):
 * `gateway.ts` có 65 hằng đường dẫn do tay viết. Type sinh từ OpenAPI không
 * tự bắt được hằng viết sai — chỉ báo lỗi khi ai đó *dùng* nó. Script này
 * chủ động đi tìm hằng nào không tồn tại trong hợp đồng thật, nên lỗi lộ ra
 * ngay ở gate chứ không phải lúc chạy thật.
 *
 * Cách đối chiếu:
 *   - Hằng dạng chuỗi: `'/api/orders'` → so trực tiếp.
 *   - Hằng dạng hàm: `` (id: string) => `/api/orders/${id}` `` → `${id}` thành
 *     `{id}`. Tên tham số ở hai bên có thể khác (`${id}` vs `{vendorId}`), nên
 *     **mọi** tham số đều được quy về `{}` trước khi so — điều kiện cần
 *     để so là *vị trí* tham số, không phải tên biến.
 *
 * Chạy: `node scripts/check-api-contract.mjs`
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const GATEWAY_FILE = resolve(process.cwd(), 'src/shared/api/gateway.ts');
const OPENAPI_FILE = resolve(process.cwd(), 'src/shared/api/generated/openapi.json');

/**
 * Đường dẫn cố ý không có trong OpenAPI.
 *
 * - `/ws` — WebSocket STOMP, không phải REST nên springdoc không mô tả.
 * - `/api/audit-logs` — orchestrator chưa mở REST cho nhật ký kiểm toán
 *   (xem `NOT_IMPLEMENTED_YET` trong `gateway.ts`).
 */
const ALLOWLIST = new Set(['/ws', '/api/audit-logs']);

/**
 * Đọc spec OpenAPI đã hợp nhất.
 *
 * @returns {object} spec hợp nhất
 */
function readSpec() {
  try {
    return JSON.parse(readFileSync(OPENAPI_FILE, 'utf8'));
  } catch (error) {
    throw new Error(
      `Không đọc được ${OPENAPI_FILE}. ` +
        `Chạy \`npm run generate:api-types\` trước (cần gateway đang chạy). ` +
        `Lỗi gốc: ${error.message}`,
    );
  }
}

/**
 * Quy mọi tham số đường dẫn về `{}` để so khớp vị trí, không so tên biến.
 *
 * @param {string} path đường dẫn
 * @returns {string} đường dẫn đã chuẩn hoá
 */
function normalize(path) {
  // `${id}` (kiểu template của TS) và `{id}` (kiểu OpenAPI) đều về `{}`.
  return path.replace(/\$\{[^}]*\}/g, '{}').replace(/\{[^}]*\}/g, '{}');
}

/**
 * Lấy tất cả hằng đường dẫn trong `GATEWAY`.
 *
 * @param {string} source nội dung `gateway.ts`
 * @returns {{ path: string, line: number }[]} đường dẫn tĩnh
 */
function extractStaticPaths(source) {
  const results = [];
  const lines = source.split('\n');
  lines.forEach((line, index) => {
    // Bỏ qua comment để không lấy nhầm đường dẫn trong chú thích.
    const code = line.replace(/\/\/.*$/, '');
    const match = /'([^']*\/(?:api|ws|internal)[^']*)'/.exec(code);
    if (!match) return;
    const value = match[1];
    if (value.includes('${')) return; // hằng dạng hàm, xử lý ở `extractTemplatePaths`
    results.push({ path: value, line: index + 1 });
  });
  return results;
}

/**
 * Lấy các đường dẫn dạng hàm (`` (id) => `/api/x/${id}` ``).
 *
 * @param {string} source nội dung `gateway.ts`
 * @returns {{ path: string, line: number }[]} đường dẫn có tham số
 */
function extractTemplatePaths(source) {
  const results = [];
  const lines = source.split('\n');
  lines.forEach((line, index) => {
    const code = line.replace(/\/\/.*$/, '');
    const match = /`([^`]*\/api[^`]*)`/.exec(code);
    if (!match) return;
    const value = match[1];
    if (!value.includes('${')) return;
    results.push({ path: normalize(value), line: index + 1 });
  });
  return results;
}

function main() {
  const source = readFileSync(GATEWAY_FILE, 'utf8');
  const spec = readSpec();
  const known = new Set(Object.keys(spec.paths ?? {}).map(normalize));

  const entries = [...extractStaticPaths(source), ...extractTemplatePaths(source)];
  // Bỏ trùng: cùng một đường dẫn có thể xuất hiện ở nhiều hằng.
  const seen = new Map();
  for (const entry of entries) {
    const key = normalize(entry.path);
    if (!seen.has(key)) seen.set(key, entry.line);
  }

  const missing = [];
  for (const [path, line] of seen) {
    if (ALLOWLIST.has(path)) continue;
    if (!known.has(path)) missing.push({ path, line });
  }

  if (missing.length > 0) {
    console.error(`\n✗ ${missing.length} hằng đường dẫn trong gateway.ts không có trong hợp đồng OpenAPI:`);
    for (const { path, line } of missing) {
      console.error(`  · ${path}  (gateway.ts:${line})`);
    }
    console.error('\nHoặc backend chưa mở endpoint đó, hoặc hằng đã lệch. Sửa một trong hai.');
    process.exit(1);
  }

  console.log(
    `✓ ${seen.size - ALLOWLIST.size} hằng đường dẫn trong gateway.ts khớp với hợp đồng OpenAPI ` +
      `(${ALLOWLIST.size} hằng được allowlist).`,
  );
}

main();
