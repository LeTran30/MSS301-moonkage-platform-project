import { Link } from 'react-router-dom';
import { Icon } from '../Icon/Icon';
import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  to?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`${styles.breadcrumbs} ${className}`}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const target = item.to || item.path;

          return (
            <li key={index} className={styles.item}>
              {index > 0 && (
                <span className={styles.separator} aria-hidden="true">
                  <Icon name="chevronRight" size={12} />
                </span>
              )}
              {target && !isLast ? (
                <Link to={target} className={styles.link}>
                  {index === 0 && <Icon name="home" size={13} className={styles.homeIcon} />}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span className={styles.current} aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
