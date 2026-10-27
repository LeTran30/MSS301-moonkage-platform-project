import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './SectionHeader.module.css';

/** DS section head (mk-section-head): title left, an optional "see all" text action right. */
export function SectionHeader({
  id,
  title,
  linkTo,
  linkLabel,
}: {
  id: string;
  title: ReactNode;
  linkTo?: string;
  linkLabel?: string;
}) {
  return (
    <div className={styles.sectionHead}>
      <h2 id={id} className={styles.heading}>
        {title}
      </h2>
      {linkTo && linkLabel && (
        <Link to={linkTo} className="mk-btn mk-btn--text">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
