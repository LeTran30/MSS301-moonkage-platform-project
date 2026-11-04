import styles from './PageLoader.module.css';
import { Skeleton } from '../Skeleton/Skeleton';

export function PageLoader() {
  return (
    <div className={styles.page}>
      <Skeleton variant="text" width="40%" height={32} className={styles.headerSkeleton} />
      <Skeleton variant="text" width="60%" height={18} className={styles.bodySkeleton} />
      <div className={styles.cardGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="card" height={320} />
        ))}
      </div>
    </div>
  );
}
