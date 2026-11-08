import { useEffect } from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { Button, Card, Icon } from '@/shared/ui';
import { captureUnexpectedError } from '@/shared/observability';
import styles from './RouteErrorBoundary.module.css';

export function RouteErrorBoundary() {
  const error = useRouteError();

  let errorMessage = 'Đã có sự cố bất ngờ xảy ra khi tải dữ liệu giao diện.';
  let statusCode = 500;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    errorMessage = error.statusText || error.data?.message || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  // Lỗi route là lỗi ứng dụng (không phải lỗi dữ liệu người dùng nhập sai):
  // báo để đội vận hành thấy màn hình nào đang hỏng.
  // Báo trong effect chứ không trong render: boundary render lại nhiều lần,
  // báo trong render sẽ tạo bản sao lặp lại của cùng một lỗi.
  useEffect(() => {
    captureUnexpectedError(error, {
      source: 'route-error-boundary',
      statusCode,
    });
  }, [error, statusCode]);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className={styles.container} role="alert" aria-live="assertive">
      <Card padding="lg" className={styles.errorCard}>
        <div className={styles.iconWrap}>
          <Icon name="alert" size={48} />
        </div>
        <span className={styles.errorCode}>MÃ LỖI {statusCode}</span>
        <h2 className={styles.title}>Không thể hiển thị trang</h2>
        <p className={styles.message}>{errorMessage}</p>

        <div className={styles.actions}>
          <Button variant="primary" size="md" onClick={handleReload} iconLeft="refresh">
            Tải lại trang
          </Button>
          <Link to="/" className={styles.homeLink}>
            Về trang chủ Moonkage
          </Link>
        </div>
      </Card>
    </div>
  );
}
