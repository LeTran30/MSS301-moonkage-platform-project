/**
 * Khai báo kiểu cho matcher `toHaveNoViolations` của `vitest-axe`.
 *
 * Gói `vitest-axe` khai báo theo cách của Vitest 0.x (`declare global { namespace Vi }`),
 * còn Vitest 5 dùng `declare module "vitest" { interface Assertion }`. Vì vậy phải
 * khai báo lại theo cách của Vitest 5, nếu không `expect(x).toHaveNoViolations()`
 * sẽ báo lỗi TypeScript dù chạy test thì vẫn đúng.
 */
import type { AxeMatchers } from 'vitest-axe/matchers';

declare module 'vitest' {
  interface Assertion<T = unknown> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

export {};
