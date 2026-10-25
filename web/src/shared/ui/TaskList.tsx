import { Link } from 'react-router-dom';

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
    <ul className="row-list">
      {tasks.map((t) => (
        <li key={t.id} className="row-list__item">
          <span className="mk-badge mk-badge--soft">{t.tag}</span>
          <div className="row-list__main">
            <p className="row-list__title">{t.title}</p>
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
