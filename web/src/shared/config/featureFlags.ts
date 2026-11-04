/**
 * Feature flag — công tắc bật/tắt tính năng không cần deploy lại.
 *
 * Vì sao cần: khi một tính năng mới lỗi trên production, bản deploy chưa kịp
 * sửa thì phải tắt được nó ngay. Với feature flag, chỉ cần đổi biến môi trường
 * là tính năng biến mất khỏi giao diện — không cần build lại, không cần deploy.
 *
 * Cơ chế: cờ được đọc từ `VITE_FEATURE_*` lúc build. Để tắt nhanh hơn nữa (không
 * cần deploy), có thể ghi đè lúc chạy qua `window.__MOONKAGE_FLAGS__` — ví dụ
 * thêm một script nhỏ vào `index.html` từ hệ thống config tập trung.
 *
 * ```html
 * <script>window.__MOONKAGE_FLAGS__ = { newCheckout: false };</script>
 * ```
 *
 * Cờ nào bật mặc định thì ghi trong `DEFAULT_FLAGS` — mặc định là **tắt** cho
 * tính năng mới, và **bật** cho tính năng đã ổn định.
 */
import { useEffect, useReducer } from 'react';

export type FeatureFlag =
  /** Luồng thanh toán mới (thay cho luồng cũ). */
  | 'newCheckout'
  /** Bảng điều khiển người bán: biểu đồ doanh thu theo tháng. */
  | 'vendorAnalytics'
  /** Gửi OTP qua Zalo ZNS thay vì email. */
  | 'otpViaZns'
  /** Bật realtime STOMP (tắt khi backend chưa sẵn sàng). */
  | 'realtimeUpdates';

/**
 * Trạng thái mặc định của từng cờ.
 *
 * `true`  = bật (tính năng đã ổn định, ai cũng dùng).
 * `false` = tắt (tính năng đang thử nghiệm, chỉ bật khi cần).
 */
const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  newCheckout: false,
  vendorAnalytics: false,
  otpViaZns: false,
  realtimeUpdates: true,
};

/** Cờ ghi đè lúc chạy, do `index.html` hoặc config tập trung cài vào. */
declare global {
  interface Window {
    __MOONKAGE_FLAGS__?: Partial<Record<FeatureFlag, boolean>>;
    __setMoonkageFlags?: (next: Partial<Record<FeatureFlag, boolean>>) => void;
  }
}

/**
 * Người nghe thay đổi cờ, để component re-render khi cờ đổi.
 *
 * Cờ đổi khi `window.__MOONKAGE_FLAGS__` được gán lại (script của hệ thống
 * config tập trung nạp xong). Ta dùng một setter thay vì đọc trực tiếp để có
 * điểm neo cho việc thông báo.
 */
let runtimeFlags: Partial<Record<FeatureFlag, boolean>> | undefined;
const listeners = new Set<() => void>();

/**
 * Gán cờ ghi đè lúc chạy và báo cho các component đang theo dõi biết.
 *
 * Đây là đường tắt tính năng *không cần deploy*: hệ thống config tập trung
 * gọi hàm này (qua `window.__setMoonkageFlags`) rồi trang tự cập nhật.
 */
export function setRuntimeFlags(next: Partial<Record<FeatureFlag, boolean>> | undefined): void {
  runtimeFlags = next;
  if (typeof window !== 'undefined') {
    window.__MOONKAGE_FLAGS__ = next;
  }
  listeners.forEach((listener) => listener());
}

const env = (typeof import.meta !== 'undefined' && import.meta.env
  ? import.meta.env
  : {}) as Record<string, string | undefined>;

/**
 * Đọc cờ từ biến môi trường: `VITE_FEATURE_NEW_CHECKOUT=true`.
 *
 * Tên biến là `VITE_FEATURE_` + tên cờ ở dạng SCREAMING_SNAKE_CASE.
 */
function fromEnv(flag: FeatureFlag): boolean | undefined {
  const key = `VITE_FEATURE_${flag.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
  const raw = env[key];
  if (raw === undefined || raw === '') return undefined;
  return raw === 'true';
}

/**
 * Cờ có đang bật không.
 *
 * Thứ tự ưu tiên: ghi đè lúc chạy → biến môi trường → mặc định.
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const runtime = runtimeFlags?.[flag] ?? (typeof window !== 'undefined' ? window.__MOONKAGE_FLAGS__?.[flag] : undefined);
  if (typeof runtime === 'boolean') return runtime;

  const fromBuild = fromEnv(flag);
  if (typeof fromBuild === 'boolean') return fromBuild;

  return DEFAULT_FLAGS[flag];
}

/** Toàn bộ cờ đang hiệu lực — dùng cho màn hình quản trị hoặc log. */
export function getActiveFlags(): Record<FeatureFlag, boolean> {
  const flags = {} as Record<FeatureFlag, boolean>;
  (Object.keys(DEFAULT_FLAGS) as FeatureFlag[]).forEach((flag) => {
    flags[flag] = isFeatureEnabled(flag);
  });
  return flags;
}

/**
 * React hook để dùng cờ trong component.
 *
 * Component đọc cờ sẽ re-render khi cờ đổi — không cần reload trang.
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    listeners.add(forceUpdate);
    return () => {
      listeners.delete(forceUpdate);
    };
  }, []);

  return isFeatureEnabled(flag);
}
