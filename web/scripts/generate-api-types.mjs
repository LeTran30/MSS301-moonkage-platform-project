/* eslint-disable no-console */
/**
 * Sinh type TypeScript từ OpenAPI của 7 service, hợp nhất thành một hợp đồng.
 *
 * Vì sao cần (C-3 trong `docs/architecture/debt-implementation-plan.md`): 65 hằng
 * đường dẫn trong `shared/api/gateway.ts` do tay viết và phải khớp với
 * controller của backend. Hôm nay khớp, nhưng không có gì ngăn ai thêm một
 * endpoint ở backend mà web không biết. Sinh type từ OpenAPI biến hợp đồng đó
 * thành thứ **máy kiểm tra**, không phải thứ người phải nhớ.
 *
 * Cách làm:
 *
 *   1. Tải `/v3/api-docs` của từng service qua gateway.
 *   2. Đổi `servers` thành đường dẫn public `/api/...` — không phải
 *      `/<service>/api/...` — vì gateway phục vụ đường dẫn canonical (D-30).
 *   3. Hợp nhất: đường dẫn trùng nhau thì phải **giống hệt** nhau, nếu không
 *      script dừng với thông báo rõ ràng. Schema trùng tên thì được đổi tên
 *      theo service để không lẫn.
 *   4. Ghi ra `src/shared/api/generated/` — **shared** vì đây là hợp đồng,
 *      không thuộc entity nào.
 *
 * Chạy: `node scripts/generate-api-types.mjs`
 *
 * Kiểm tra trong CI: chạy script rồi `git diff --exit-code` — nếu type sinh ra
 * lệch với API thật thì gate đỏ.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

/**
 * `openapi-typescript` nằm ở `web/codegen/`, không ở `web/` — vì nó cần
 * TypeScript 5 (JS API `ts.factory`), còn web dùng TypeScript 7. Node không tự
 * tìm thấy, nên nạp bằng `createRequire` neo vào đúng thư mục đó.
 */
const require = createRequire(resolve(process.cwd(), 'codegen', 'noop.cjs'));
const { default: openapiTS, astToString } = require('openapi-typescript');

/** Cổng gateway. Mặc định 8080; đổi bằng `API_GATEWAY_URL` khi cần. */
const GATEWAY = process.env.API_GATEWAY_URL ?? 'http://127.0.0.1:8080';

/** Thư mục sinh type. */
const OUT_DIR = resolve(process.cwd(), 'src/shared/api/generated');

/**
 * 7 service của nền tảng, theo thứ tự của `docs/architecture/api-db/README.md`.
 * Tên service ở đây chỉ để đặt tiền tố cho schema trùng tên và để báo lỗi
 * dễ hiểu — đường dẫn public không mang tên service (D-30).
 */
const SERVICES = [
  'identity-service',
  'vendor-service',
  'catalog-service',
  'quotation-service',
  'order-service',
  'payment-service',
  'orchestrator-service',
];

/**
 * Tải OpenAPI của một service.
 *
 * @param {string} service tên service
 * @returns {Promise<object>} tài liệu OpenAPI
 */
async function fetchSpec(service) {
  const url = `${GATEWAY}/${service}/v3/api-docs`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} -> ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Đổi `servers` của một spec thành đường dẫn public.
 *
 * Spec của service mô tả hợp đồng **nội bộ** (`http://host/<service>`), nhưng
 * client gọi qua gateway theo đường dẫn canonical `/api/...` (D-30). Nếu giữ
 * nguyên, type sinh ra sẽ sinh path `/identity-service/api/...` — sai với
 * đường dẫn thật.
 *
 * @param {object} spec tài liệu OpenAPI
 * @param {string} service tên service
 * @returns {object} spec đã đổi
 */
function toCanonicalServers(spec, service) {
  const base = spec.servers?.[0]?.url ?? '';
  const withoutPrefix = base.replace(/\/[^/]*\/?$/, '');
  spec.servers = [{ url: withoutPrefix || '/', description: `Canonical gateway path (${service})` }];
  return spec;
}

/**
 * Đổi tên schema trùng giữa các service.
 *
 * `FieldError` xuất hiện ở cả 7 service, `PresignedUploadLinkResponse` ở
 * vendor + order — chúng **không phải** cùng một kiểu. Đổi tên theo service
 * để type sinh ra không nhập nhằng.
 *
 * @param {object} spec tài liệu OpenAPI
 * @param {string} service tên service
 * @param {Set<string>} taken tên schema đã dùng
 * @returns {string[][]} danh sách `[tên cũ, tên mới]` đã đổi
 */
function disambiguateSchemas(spec, service, taken) {
  const schemas = spec.components?.schemas;
  if (!schemas) return [];

  const renamed = [];
  for (const name of Object.keys(schemas)) {
    if (!taken.has(name)) {
      taken.add(name);
      continue;
    }
    const unique = `${capitalize(service.replace(/-service$/, ''))}${name}`;
    taken.add(unique);
    renamed.push([name, unique]);
  }

  if (renamed.length === 0) return [];

  // Đổi tên trong `components.schemas` và mọi tham chiếu `$ref` trong toàn spec.
  let text = JSON.stringify(spec);
  for (const [from, to] of renamed) {
    text = text.split(`"#/components/schemas/${from}"`).join(`"#/components/schemas/${to}"`);
  }
  const rebuilt = JSON.parse(text);

  const target = rebuilt.components.schemas;
  for (const [from, to] of renamed) {
    target[to] = target[from];
    delete target[from];
  }
  rebuilt.components.schemas = target;
  Object.assign(spec, rebuilt);
  return renamed;
}

/**
 * Viết hoa chữ cái đầu.
 *
 * @param {string} value chuỗi
 * @returns {string} chuỗi đã viết hoa
 */
function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Hợp nhất các spec thành một tài liệu OpenAPI.
 *
 * @param {Map<string, object>} specs spec theo tên service
 * @returns {object} tài liệu OpenAPI hợp nhất
 */
function mergeSpecs(specs) {
  const merged = {
    openapi: '3.1.0',
    info: {
      title: 'Moonkage API',
      version: '1.0.0',
      description:
        'Hợp đồng hợp nhất của 7 service, sinh tự động từ OpenAPI của từng service.\n' +
        'Nguồn sự thật: `docs/architecture/api-db/` và mã nguồn backend.\n' +
        'KHÔNG sửa file này bằng tay — chạy `node scripts/generate-api-types.mjs`.',
    },
    servers: [{ url: '/', description: 'Canonical gateway path' }],
    paths: {},
    components: { schemas: {} },
  };

  const takenSchemas = new Set();
  const pathOwners = new Map();

  for (const [service, spec] of specs) {
    for (const [path, item] of Object.entries(spec.paths ?? {})) {
      const owner = pathOwners.get(path);
      if (owner) {
        // Hai service cùng phục vụ một đường dẫn: gateway chỉ định tuyến được
        // một service, nên phải kiểm tra chúng giống hệt nhau.
        const before = JSON.stringify(item);
        const after = JSON.stringify(merged.paths[path]);
        if (before !== after) {
          throw new Error(
            `Đường dẫn ${path} tồn tại ở cả ${owner} và ${service} nhưng mô tả khác nhau. ` +
              'Sửa lại định tuyến ở gateway trước khi sinh type.',
          );
        }
        continue;
      }
      pathOwners.set(path, service);
      merged.paths[path] = item;
      // Khóa tạm để biết đường dẫn này thuộc service nào (dùng khi đổi tên
      // `operationId`). Được xoá trước khi trả về.
      merged.paths[`__owner__${path}`] = service;
    }

    if (spec.components?.schemas) {
      const renamed = disambiguateSchemas(spec, service, takenSchemas);
      if (renamed.length > 0) {
        console.log(
          `  · ${service}: đổi tên ${renamed.length} schema trùng (${renamed
            .map(([from, to]) => `${from} → ${to}`)
            .join(', ')})`,
        );
      }
      Object.assign(merged.components.schemas, spec.components.schemas);
    }
  }

  disambiguateOperationIds(merged);

  for (const path of Object.keys(merged.paths)) {
    if (path.startsWith('__owner__')) delete merged.paths[path];
  }

  return merged;
}

/**
 * Đảm bảo mọi operation có `operationId` khác nhau.
 *
 * `openapi-typescript` **bắt buộc** `operationId` là duy nhất trong toàn tài
 * liệu. Nhưng mỗi service đặt `operationId` theo quy ước riêng (`list`,
 * `create`, `update`, `get`…) nên khi hợp nhất 7 service lại đụng nhau —
 * ví dụ `list` của identity và `list` của payment.
 *
 * Cách xử lý: đếm `operationId` trong toàn hợp đồng, `operationId` nào bị
 * trùng thì đổi thành `<Service><operationId>` (ví dụ `list` → `PaymentList`).
 * `operationId` vốn đã duy nhất thì giữ nguyên — không đổi hợp đồng vô ích.
 *
 * @param {object} merged tài liệu đang hợp nhất (được sửa tại chỗ)
 */
function disambiguateOperationIds(merged) {
  /** @type {Map<string, number>} */
  const counts = new Map();

  for (const [path, item] of Object.entries(merged.paths)) {
    if (path.startsWith('__owner__')) continue;
    for (const operation of Object.values(item)) {
      if (!operation || typeof operation !== 'object') continue;
      const id = operation.operationId;
      if (typeof id !== 'string') continue;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  const duplicated = new Set([...counts].filter(([, n]) => n > 1).map(([id]) => id));
  if (duplicated.size === 0) return;

  for (const [path, item] of Object.entries(merged.paths)) {
    if (path.startsWith('__owner__')) continue;
    const service = merged.paths[`__owner__${path}`] ?? '';
    const prefix = capitalize(service.replace(/-service$/, ''));
    for (const operation of Object.values(item)) {
      if (!operation || typeof operation !== 'object') continue;
      const id = operation.operationId;
      if (typeof id !== 'string' || !duplicated.has(id)) continue;
      const unique = `${prefix}${capitalize(id)}`;
      operation.operationId = unique;
      console.log(`  · ${service}: operationId "${id}" → "${unique}"`);
    }
  }
}

/**
 * Sinh file type TypeScript từ một tài liệu OpenAPI.
 *
 * @param {object} spec tài liệu OpenAPI hợp nhất
 * @returns {Promise<string>} nội dung file .ts
 */
async function generateTypes(spec) {
  const ast = await openapiTS(spec, {
    alphabetize: true,
    additionalProperties: false,
    emptyObjectsUnknown: true,
  });
  const contents = astToString(ast);
  // Không bọc nội dung sinh ra trong khối comment `/* ... */`: bản sinh có sẵn
  // các doc comment `/** ... */` của riêng nó, nối vào sẽ làm khối comment ngoài
  // bị đóng sớm và file hỏng cú pháp. Dùng `//` cho phần giải thích.
  const header = [
    '// File này SINH TỰ ĐỘNG — không sửa bằng tay.',
    '//',
    '// Nguồn: OpenAPI của 7 service, hợp nhất bởi `web/scripts/generate-api-types.mjs`.',
    '// Chạy lại script sau khi backend đổi hợp đồng.',
    '',
  ].join('\n');
  return `/* eslint-disable */\n${header}${contents}`;
}

async function main() {
  console.log(`Đang tải OpenAPI từ ${GATEWAY} …`);
  const specs = new Map();
  for (const service of SERVICES) {
    const spec = await fetchSpec(service);
    toCanonicalServers(spec, service);
    specs.set(service, spec);
    console.log(`  · ${service}: ${Object.keys(spec.paths ?? {}).length} đường dẫn`);
  }

  console.log('Đang hợp nhất …');
  const merged = mergeSpecs(specs);
  console.log(
    `  · tổng ${Object.keys(merged.paths).length} đường dẫn, ${Object.keys(merged.components.schemas).length} schema`,
  );

  console.log('Đang sinh type TypeScript …');
  const types = await generateTypes(merged);

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(resolve(OUT_DIR, 'api.ts'), types, 'utf8');
  // Bản JSON hợp nhất để diff được với hợp đồng gốc.
  writeFileSync(resolve(OUT_DIR, 'openapi.json'), `${JSON.stringify(merged, null, 2)}\n`, 'utf8');

  console.log(`\n✓ Đã sinh ${resolve(OUT_DIR, 'api.ts')}`);
  console.log(`✓ Đã sinh ${resolve(OUT_DIR, 'openapi.json')}`);
}

main().catch((error) => {
  console.error(`\n✗ Sinh type thất bại: ${error.message}`);
  process.exit(1);
});
