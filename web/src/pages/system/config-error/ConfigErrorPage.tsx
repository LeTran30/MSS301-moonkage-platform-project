import { Badge, Button, Card } from '@/shared/ui';
import styles from './ConfigErrorPage.module.css';

/**
 * Shown instead of the whole app when `VITE_API_BASE_URL` is missing or
 * invalid (see `isConfigValid` in `shared/config/env.ts`).
 *
 * Without it every screen would fail with an opaque network error; here the
 * developer is told exactly which file to create and which key to fill in.
 */
export function ConfigErrorPage() {
  return (
    <div className={styles.page}>
      <Card padding="lg" className={styles.card}>
        <div className={styles.header}>
          <p className={styles.brand}>Moonkage</p>
          <Badge tone="red" size="md">
            Cấu hình chưa hoàn tất
          </Badge>
        </div>

        <h1 className={styles.title}>Thiếu cấu hình API Gateway</h1>
        <p className={styles.desc}>
          Ứng dụng chưa biết gọi API Gateway ở đâu. Hãy tạo file <code>.env.local</code> trong
          thư mục gốc của web, điền địa chỉ gateway rồi chạy lại <code>npm run dev</code>.
        </p>

        <div className={styles.codeBlock}>
          <span className={styles.codeLabel}>File cần tạo: web/.env.local</span>
          <pre className={styles.code}>
{`# Sao chép từ .env.example rồi điền giá trị thật
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws

# Hoặc bật chế độ demo (dữ liệu mô phỏng, không cần máy chủ)
VITE_DEMO_MODE=true`}
          </pre>
        </div>

        <div className={styles.steps}>
          <h2 className={styles.stepsTitle}>Các bước khắc phục</h2>
          <ol className={styles.stepList}>
            <li>
              Sao chép <code>web/.env.example</code> thành <code>web/.env.local</code>.
            </li>
            <li>
              Điền <code>VITE_API_BASE_URL</code> trỏ tới gateway (mặc định{' '}
              <code>http://localhost:8080</code>).
            </li>
            <li>
              Chạy lại <code>npm run dev</code> — biến môi trường chỉ được đọc lúc khởi động.
            </li>
          </ol>
        </div>

        <p className={styles.footnote}>
          Nếu bạn chỉ muốn xem giao diện mà không có máy chủ, đặt{' '}
          <code>VITE_DEMO_MODE=true</code> trong file trên.
        </p>

        <div className={styles.actions}>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Tải lại trang
          </Button>
        </div>
      </Card>
    </div>
  );
}
