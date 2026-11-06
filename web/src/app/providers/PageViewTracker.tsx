/**
 * Theo dõi lần xem trang — gửi sự kiện `page_view` mỗi khi người dùng đổi trang.
 *
 * Vì sao không dùng `useLocation` / `useMatches` của React Router: hook này
 * phải nằm **bên trong** `<RouterProvider>`, còn `AppProviders` lại là cha của
 * `RouterProvider` (xem `App.tsx`). Dùng hook ở đó sẽ ném lỗi invariant và
 * làm sập cả ứng dụng.
 *
 * Vì sao dùng `router.subscribe`: router là đối tượng độc lập với cây React,
 * nên ta có thể đăng ký ngay từ `routes.tsx` mà không phụ thuộc vị trí render.
 * Mỗi lần router chuyển trạng thái (điều hướng xong), ta gửi một sự kiện.
 *
 * Vì sao lấy mẫu route chứ không phải `location.pathname`: pathname thô chứa
 * id thật (`/san-pham/prod_01`) nên mỗi sản phẩm sẽ thành một trang riêng
 * trong báo cáo. Mẫu route (`/san-pham/:id`) gộp chúng lại — đúng những gì
 * ta cần để đo funnel.
 */
import { trackPageView } from '@/shared/observability';

/** Một route đã khớp, ở dạng rút gọn — chỉ cần mẫu đường dẫn. */
export interface RoutePattern {
  /** Mẫu route, ví dụ `san-pham/:id` (không có dấu `/` đầu). */
  path?: string;
}

/** Trạng thái router mà ta cần để theo dõi. */
export interface TrackedRouterState {
  location: { pathname: string };
  matches: { route: RoutePattern }[];
}

/** Router ở dạng rút gọn — chỉ những gì ta dùng. */
export interface TrackedRouter {
  state: TrackedRouterState;
  subscribe: (fn: (state: TrackedRouterState) => void) => () => void;
}

/**
 * Dựng mẫu route từ danh sách route đã khớp.
 *
 * Mỗi route trong `matches` có `path` **tương đối** (`san-pham/:id`), nên ta
 * ghép lại thành đường dẫn đầy đủ (`/san-pham/:id`).
 */
export function buildRoutePattern(matches: { route: RoutePattern }[]): string | null {
  const segments = matches
    .map((m) => m.route.path)
    .filter((path): path is string => Boolean(path) && path !== '/');

  if (segments.length === 0) return '/';
  return `/${segments.join('/')}`;
}

/**
 * Bắt đầu gửi sự kiện `page_view` theo lần điều hướng của router.
 *
 * @param router Router của React Router (đã `initialize`).
 *
 * Hàm trả về hàm huỷ đăng ký, để test dọn dẹp được.
 */
export function startPageViewTracking(router: TrackedRouter): () => void {
  /** Đường dẫn đã gửi — tránh gửi trùng khi router báo lại cùng một trang. */
  let lastPathname: string | null = null;

  const send = (state: TrackedRouterState): void => {
    const pathname = state.location.pathname;
    if (pathname === lastPathname) return;
    lastPathname = pathname;

    // Không khớp route nào (đường dẫn lạ) → dùng chính URL làm mẫu.
    const pagePath = buildRoutePattern(state.matches) ?? pathname;
    trackPageView(pagePath, document.title);
  };

  // Lần tải đầu tiên: router đã có `state.location` trước khi render.
  send(router.state);

  return router.subscribe(send);
}
