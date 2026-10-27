import styles from './Avatar.module.css';

/** Initials in a circle, for a supplier or a reviewer without a photo. */
export function Avatar({ initials, size = 'md' }: { initials: string; size?: 'md' | 'lg' }) {
  return (
    <span className={`${styles.avatar} ${styles[size]}`} aria-hidden="true">
      {initials}
    </span>
  );
}
