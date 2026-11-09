import { apiPost, gatewayUrl } from './helpers';

/**
 * Tải file lên kho lưu trữ đối tượng (MinIO) theo kiểu hai bước.
 *
 * Mọi file của sàn (giấy tờ pháp lý của người bán, ảnh sản phẩm, bằng chứng
 * khiếu nại) đi qua cùng một cơ chế (FR-26, FR-29):
 *
 * 1. Client hỏi service sở hữu bucket: `POST /api/.../uploads` với
 *    `{contentType, sizeBytes}` → nhận `tempKey`, `uploadUrl` và `formFields`.
 * 2. Client POST thẳng file lên `uploadUrl` kèm `formFields` (chính sách ký
 *    của MinIO ràng buộc đúng key, đúng content-type, đúng kích thước).
 * 3. Client gửi `tempKey` đi kèm nghiệp vụ; service kiểm tra file thật (magic
 *    bytes) rồi chuyển nó về kho đích.
 *
 * Vì sao tải ở **Node** chứ không phải trong trình duyệt: CSP của ứng dụng
 * khai báo `connect-src` chỉ cho phép origin của gateway. `fetch` từ trong
 * trang tới `http://localhost:9000` bị chặn ⇒ upload không bao giờ tới nơi.
 * Test chạy ở tầng Node nên không bị CSP đó, và `FormData` của Node gửi
 * multipart đúng như trình duyệt.
 */

/** Link tải lên do backend trả về. */
export interface UploadLink {
  tempKey: string;
  uploadUrl: string;
  formFields: Record<string, string>;
  expiresAt?: string;
}

/**
 * Hỏi backend một link tải lên có ký.
 *
 * @param path đường dẫn tuyệt đối của endpoint upload (gateway)
 * @param contentType kiểu nội dung của file
 * @param sizeBytes kích thước file, **bằng byte**
 */
export async function createUploadLink(
  page: import('@playwright/test').Page,
  path: string,
  contentType: string,
  sizeBytes: number,
): Promise<UploadLink> {
  const link = await apiPost<UploadLink>(page, gatewayUrl(path), { contentType, sizeBytes });
  if (!link?.uploadUrl || !link?.tempKey) {
    throw new Error(`Không nhận được link tải lên từ ${path}.`);
  }
  return link;
}

/**
 * Gửi một file lên link đã ký.
 *
 * Thứ tự trường: mọi trường của `formFields` trước, file sau, tên trường
 * file là `file` — đúng như `uploadFileToLink` của ứng dụng.
 */
export async function uploadToPresigned(
  link: UploadLink,
  content: Buffer,
  fileName: string,
  contentType: string,
): Promise<void> {
  const form = new FormData();
  for (const [key, value] of Object.entries(link.formFields ?? {})) {
    form.append(key, value);
  }
  form.append(
    'file',
    new Blob([new Uint8Array(content)], { type: contentType }),
    fileName,
  );

  const response = await fetch(link.uploadUrl, { method: 'POST', body: form });
  if (!response.ok) {
    throw new Error(
      `Tải file lên kho lưu trữ thất bại: ${response.status} ${await response.text()}`,
    );
  }
}

/**
 * Tải lên một file và trả về `tempKey` để gắn vào nghiệp vụ.
 *
 * @param path đường dẫn tuyệt đối của endpoint upload (gateway)
 */
export async function uploadFile(
  page: import('@playwright/test').Page,
  path: string,
  content: Buffer,
  fileName: string,
  contentType: string,
): Promise<string> {
  const link = await createUploadLink(page, path, contentType, content.byteLength);
  await uploadToPresigned(link, content, fileName, contentType);
  return link.tempKey;
}

/**
 * Một tệp PDF hợp lệ (magic bytes `%PDF-`), đủ để backend nhận.
 *
 * Backend kiểm tra **magic bytes** chứ không kiểm tra cấu trúc PDF đầy đủ, nên
 * tệp tối giản này đi qua đúng như tệp thật.
 */
export function minimalPdf(title: string): Buffer {
  return Buffer.from(
    `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n` +
      `2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n` +
      `3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\n` +
      `trailer<</Root 1 0 R>>\n%%EOF\n% ${title}\n`,
    'latin1',
  );
}

/**
 * Một ảnh PNG hợp lệ: chữ ký PNG + chunk `IHDR` + `IDAT` + `IEND`.
 *
 * Backend bỏ metadata của ảnh (`ImageMetadataStripper`) trước khi lưu, nên
 * ảnh phải có cấu trúc chunk đúng — một tệp rỗng sẽ bị từ chối.
 */
export function minimalPng(width = 1, height = 1): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Một khối dữ liệu zlib rỗng (không nén): 0x78 0x01 + adler32 rỗng.
  const idat = Buffer.from([0x78, 0x01, 0x01, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00, 0x00, 0x01]);

  const chunk = (type: string, data: Buffer): Buffer => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.byteLength, 0);
    const typeAndData = Buffer.concat([Buffer.from(type, 'latin1'), data]);
    // CRC-32 của phần type + data.
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData), 0);
    return Buffer.concat([length, typeAndData, crc]);
  };

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** CRC-32 (bảng tra cứu chuẩn của PNG). */
function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
