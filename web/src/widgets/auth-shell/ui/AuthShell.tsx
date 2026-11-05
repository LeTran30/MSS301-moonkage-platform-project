import type { ReactNode } from 'react';
import { Card, Icon, type IconName } from '@/shared/ui';
import { authShellStyles as styles } from './authShellStyles';

type Props = {
  /** Icon SVG hiển thị phía trên tiêu đề (thay cho emoji gốc). */
  icon?: IconName;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * The frame every auth screen shares (sign in, sign up, confirm, reset).
 *
 * It lives in `widgets/` because the same frame appears on five routes
 * (package-architecture §3, "Tầng 2: widgets").
 */
export function AuthShell({ icon, title, subtitle, children, className }: Props) {
  return (
    <div className={styles.authContainer}>
      <Card className={`${styles.authCard} ${className ?? ''}`}>
        <div className={styles.logoHeader}>
          {icon && (
            <div className={styles.moonIcon} aria-hidden="true">
              <Icon name={icon} size={44} />
            </div>
          )}
          <h1 className={styles.brandTitle}>{title}</h1>
          {subtitle && <p className={styles.brandSub}>{subtitle}</p>}
        </div>
        {children}
      </Card>
    </div>
  );
}
