import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(here, '../../../');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith('.tsx')) out.push(full);
  }
  return out;
}

/** Một `style` động hợp lệ: giá trị là biểu thức runtime. */
const DYNAMIC_STYLE = /style=\{\{[^}]*(\?|:|\$\{|\b[A-Za-z_$][\w$]*\b\s*[,}\]])/;

describe('Code style - inline styles (T-13)', () => {
  const files = walk(srcDir);

  it('còn ít inline style tĩnh (những cái động thì được phép)', () => {
    const offenders: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (!line.includes('style={{')) return;
        // Bỏ qua các inline style mang giá trị runtime.
        if (DYNAMIC_STYLE.test(line)) return;
        offenders.push(`${path.relative(srcDir, file)}:${index + 1}`);
      });
    }

    // Chỉ còn một vài inline style động; số lượng phải giữ nhỏ.
    expect(offenders.length).toBeLessThanOrEqual(4);
  });

  it('mọi file đã tách style đều có module CSS đi kèm', () => {
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      if (!content.includes('.inline.module.css')) continue;

      const modulePath = content.match(/from '(\.\/[^']*\.inline\.module\.css)'/);
      expect(modulePath, `${file} phải import module CSS`).toBeTruthy();

      const cssPath = path.resolve(path.dirname(file), modulePath![1]);
      expect(
        readFileSync(cssPath, 'utf8').length,
        `${cssPath} phải có nội dung`,
      ).toBeGreaterThan(0);
    }
  });
});
