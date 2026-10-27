import { CenteredScreen } from '@/shared/ui';
import styles from './ConfigErrorPage.module.css';

/** Shown instead of the app when VITE_API_BASE_URL is missing or invalid. */
export function ConfigErrorPage() {
  return (
    <CenteredScreen>
      <div className={`panel ${styles.panel}`}>
        <p className="brand-text">Moonkage</p>
        <p role="alert" className="error-text">
          Thiếu VITE_API_BASE_URL. Sao chép web/.env.example thành web/.env.local, điền địa chỉ gateway rồi chạy lại npm run dev.
        </p>
      </div>
    </CenteredScreen>
  );
}
