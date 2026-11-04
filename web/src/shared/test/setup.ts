/**
 * Test setup: the jest-dom matchers plus the browser APIs jsdom does not implement
 * but the app relies on.
 */
import '@testing-library/jest-dom/vitest';
// `vitest-axe/extend-expect` khai báo kiểu cho matcher `toHaveNoViolations`.
// `vitest-axe/matchers` cung cấp chính matcher để đăng ký vào `expect`.
import 'vitest-axe/extend-expect';
import * as axeMatchers from 'vitest-axe/matchers';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// `expect(results).toHaveNoViolations()` — kiểm tra accessibility bằng máy.
expect.extend(axeMatchers);

afterEach(() => {
  cleanup();
});

// jsdom has no crypto.randomUUID in older versions; the ID generator needs it.
if (typeof globalThis.crypto === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).crypto = {};
}
if (typeof globalThis.crypto.randomUUID !== 'function') {
  let counter = 0;
  globalThis.crypto.randomUUID = () => {
    counter += 1;
    return `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`;
  };
}

// The theme store persists to localStorage; keep every test isolated.
if (typeof localStorage !== 'undefined') {
  localStorage.clear();
}
