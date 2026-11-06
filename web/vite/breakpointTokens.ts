/**
 * Giải token `--breakpoint-*` trong điều kiện `@media` khi build.
 *
 * Vì sao cần: CSS **không** cho phép dùng `var()` trong điều kiện media
 * query — `@media (max-width: var(--breakpoint-md))` bị trình duyệt bỏ qua
 * một cách âm thầm (không bao giờ khớp), và `lightningcss` của Vite ném lỗi
 * `Invalid media query` lúc minify, làm hỏng cả `npm run build`.
 *
 * Nên muốn dùng token làm nguồn sự thật duy nhất, ta thay `var(--breakpoint-*)`
 * bằng giá trị px tương ứng **lúc build**, đọc trực tiếp từ
 * `src/app/styles/tokens.css` — token vẫn là nguồn sự thật duy nhất, chỉ là
 * được mở rộng ở thời điểm biên dịch thay vì lúc chạy.
 *
 * Plugin này chạy `enforce: 'pre'` nên thay trước khi `vite:css-post` xử lý
 * CSS, áp dụng cho cả `npm run dev` và `npm run build`.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

// `import.meta.dirname` trỏ tới thư mục `web/vite/`, nên token nằm ở `../src/`.
const TOKENS_FILE = resolve(import.meta.dirname, '../src/app/styles/tokens.css');

/**
 * Đọc giá trị px của các token `--breakpoint-*` trong `tokens.css`.
 *
 * @param css nội dung tokens.css
 * @returns bản đồ tên token → giá trị px
 */
function readBreakpoints(css: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /--breakpoint-([a-z]+):\s*(\d+)px\s*;/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    map.set(`--breakpoint-${m[1]}`, `${m[2]}px`);
  }
  return map;
}

/**
 * Vite plugin: thay `var(--breakpoint-*)` trong CSS bằng giá trị px.
 *
 * @returns plugin Vite đã cấu hình
 */
export function breakpointTokensPlugin(): Plugin {
  let breakpoints = new Map<string, string>();

  return {
    name: 'moonkage:breakpoint-tokens',
    enforce: 'pre',
    configResolved() {
      breakpoints = readBreakpoints(readFileSync(TOKENS_FILE, 'utf8'));
    },
    transform(code: string, id: string) {
      if (!id.endsWith('.css')) return null;
      if (breakpoints.size === 0) return null;

      let changed = false;
      const out = code.replace(/var\((--breakpoint-[a-z]+)\)/g, (whole: string, token: string) => {
        const value = breakpoints.get(token);
        if (!value) return whole;
        changed = true;
        return value;
      });

      return changed ? { code: out, map: null } : null;
    },
  };
}
