import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Card, Button, Icon } from '@/shared/ui';
import { captureUnexpectedError } from '@/shared/observability';
import styles from './LayoutErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  areaName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * LayoutErrorBoundary: Bọc nội dung của từng layout (Base, Vendor, Admin, Account)
 * Đảm bảo khi một view/component bên trong gặp sự cố, thanh điều hướng (header, sidebar)
 * vẫn sống, và có cơ chế tự phục hồi chunk reload khi deploy bản mới (P1-13).
 */
export class LayoutErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[LayoutErrorBoundary:${this.props.areaName || 'General'}]`, error, errorInfo);

    // Báo lỗi render cho Sentry kèm tên khu vực — biết vùng nào hỏng là
    // thông tin quan trọng nhất khi điều tra.
    captureUnexpectedError(error, {
      source: 'layout-error-boundary',
      area: this.props.areaName || 'General',
      componentStack: errorInfo.componentStack,
    });

    // Tự động reload một lần nếu gặp lỗi chunk hash sau đợt deploy mới
    const msg = error.message.toLowerCase();
    if (msg.includes('dynamically imported module') || msg.includes('failed to fetch')) {
      const key = `mk_chunk_reload_${window.location.pathname}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
      }
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className={styles.container} role="alert" aria-live="assertive">
          <Card padding="lg">
            <div className={styles.header}>
              <Icon name="alert" size={28} />
              <h3 className={styles.title}>
                Lỗi hiển thị nội dung {this.props.areaName ? `khu vực ${this.props.areaName}` : ''}
              </h3>
            </div>
            <p className={styles.message}>
              {this.state.error?.message ||
                'Đã có sự cố khi hiển thị khu vực này. Thanh điều hướng và các tính năng khác của hệ thống vẫn hoạt động bình thường.'}
            </p>
            <div className={styles.actions}>
              <Button variant="primary" size="sm" onClick={this.handleRetry}>
                <Icon name="check" size={14} /> Thử lại khu vực này
              </Button>
              <Button variant="outline" size="sm" onClick={this.handleReload}>
                🔄 Tải lại trang
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
