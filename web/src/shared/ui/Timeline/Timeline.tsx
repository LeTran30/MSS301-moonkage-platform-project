import styles from './Timeline.module.css';

/** DS OrderTimeline (mk-timeline): done steps, the current one, steps still to come. */
export interface TimelineStep {
  title: string;
  meta?: string;
  note?: string;
  state: 'done' | 'current' | 'todo';
}

export function Timeline({ steps, label }: { steps: TimelineStep[]; label: string }) {
  return (
    <ol className={styles.timeline} aria-label={label}>
      {steps.map((s, i) => {
        const isDone = s.state === 'done';
        const isCurrent = s.state === 'current';
        const isTodo = s.state === 'todo';
        return (
          <li
            key={`${s.title}-${i}`}
            className={`${styles.step} ${isDone ? styles.done : ''}`.trim()}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span
              className={`${styles.dot} ${isDone ? styles.doneDot : ''} ${isCurrent ? styles.currentDot : ''}`.trim()}
              aria-hidden="true"
            />
            <div>
              <div className={`${styles.title} ${isTodo ? styles.todoTitle : ''}`.trim()}>{s.title}</div>
              {s.meta && <div className={`${styles.meta} mk-num`}>{s.meta}</div>}
              {s.note && <p className={styles.note}>{s.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
