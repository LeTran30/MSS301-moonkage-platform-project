import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { routes } from '../shared/config/routes';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const isChunkError =
    error instanceof Error &&
    /loading dynamically imported module|failed to fetch dynamically imported module/i.test(error.message);

  let title = 'Đã có lỗi xảy ra';
  let message = 'Không thể tải nội dung trang. Vui lòng thử lại sau.';

  if (isRouteErrorResponse(error)) {
    title = `Lỗi ${error.status}`;
    message = error.statusText || message;
  } else if (isChunkError) {
    title = 'Phiên bản mới đã được cập nhật';
    message = 'Một số tệp ứng dụng đã được cập nhật trên máy chủ. Vui lòng tải lại trang để nhận bản mới nhất.';
  } else if (error instanceof Error && error.message) {
    message = error.message;
  }

  return (
    <div className="shop__inner" style={{ paddingBlock: 'var(--space-12)' }}>
      <div className="panel" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', justifyItems: 'center' }}>
        <h1 className="heading-text">{title}</h1>
        <p className="muted">{message}</p>
        <div className="row" style={{ marginTop: 'var(--space-4)', justifyContent: 'center' }}>
          <button
            type="button"
            className="mk-btn mk-btn--primary"
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </button>
          <a href={routes.home} className="mk-btn mk-btn--quiet">
            Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}
