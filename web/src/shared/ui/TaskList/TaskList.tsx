import { Link } from 'react-router-dom';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import styles from './TaskList.module.css';

export interface Task {
  id: string;
  tag: string;
  title: string;
  meta: string;
  to: string;
  action: string;
  primary?: boolean;
}

/** "Việc cần bạn" rows: a tag, what to do, when, and one button. */
export function TaskList({ tasks, empty }: { tasks: Task[]; empty: string }) {
  if (!tasks.length) return <p className="muted">{empty}</p>;
  return (
    <ul className={styles.rowList}>
      {tasks.map((t) => (
        <li key={t.id} className={styles.item}>
          <StatusBadge tone="soft">{t.tag}</StatusBadge>
          <div className={styles.main}>
            <p className={styles.title}>{t.title}</p>
            <p className="muted">{t.meta}</p>
          </div>
          <Link to={t.to} className={`mk-btn mk-btn--sm ${t.primary ? 'mk-btn--primary' : 'mk-btn--quiet'}`}>
            {t.action}
          </Link>
        </li>
      ))}
    </ul>
  );
}
