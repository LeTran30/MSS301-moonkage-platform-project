import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

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
    <div className="mk-section-head">
      <h2 id={id}>{title}</h2>
      {linkTo && linkLabel && (
        <Link to={linkTo} className="mk-btn mk-btn--text">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
