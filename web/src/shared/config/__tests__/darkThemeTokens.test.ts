import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const stylesDir = path.resolve(here, '../../../app/styles');

const TOKEN_RE = /^\s*(--[a-z0-9-]+)\s*:/gm;

function tokensOf(text: string): string[] {
  return [...text.matchAll(TOKEN_RE)].map((m) => m[1]);
}

/**
 * The light theme is the first `:root { ... }` block of `tokens.css`; everything from
 * the first dark selector onwards is the dark theme.
 */
function readLightTokens(): string[] {
  const content = readFileSync(path.join(stylesDir, 'tokens.css'), 'utf-8');
  const firstRoot = content.indexOf(':root {');
  const endOfRoot = content.indexOf('}', firstRoot);
  return tokensOf(content.slice(firstRoot, endOfRoot));
}

function readDarkTokens(): string[] {
  const tokens = readFileSync(path.join(stylesDir, 'tokens.css'), 'utf-8');
  const darkStart = tokens.search(/@media \(prefers-color-scheme: dark\)|:root\[data-theme='dark'\]/);
  const dark = tokens.slice(darkStart === -1 ? 0 : darkStart);

  const extra = readFileSync(path.join(stylesDir, 'tokens-dark.css'), 'utf-8');
  return [...tokensOf(dark), ...tokensOf(extra)];
}

describe('Design tokens - dark theme coverage (T-12)', () => {
  it('light theme định nghĩa hơn 90 token', () => {
    expect(readLightTokens().length).toBeGreaterThan(90);
  });

  it('mọi token màu và gradient của bản sáng đều có bản tối', () => {
    const light = readLightTokens();
    const dark = new Set(readDarkTokens());

    // The tokens that carry a colour: the ones that visibly break in dark mode.
    const mustHaveDark = light.filter((token) => /^--(color|gradient|glow)-/.test(token));

    expect(mustHaveDark.length).toBeGreaterThan(0);
    const missing = mustHaveDark.filter((token) => !dark.has(token));
    expect(missing).toEqual([]);
  });

  it('bản tối dùng cùng tên token với bản sáng', () => {
    const light = new Set(readLightTokens());
    const dark = readDarkTokens();
    const unknown = dark.filter((token) => !light.has(token));
    expect(unknown).toEqual([]);
  });
});
