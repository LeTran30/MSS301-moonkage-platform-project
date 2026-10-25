/** DS OrderTimeline (mk-timeline): done steps, the current one, steps still to come. */
export interface TimelineStep {
  title: string;
  meta?: string;
  note?: string;
  state: 'done' | 'current' | 'todo';
}

export function Timeline({ steps, label }: { steps: TimelineStep[]; label: string }) {
  return (
    <ol className="mk-timeline" aria-label={label}>
      {steps.map((s, i) => (
        <li
          key={`${s.title}-${i}`}
          className={`mk-step${s.state === 'done' ? ' mk-step--done' : s.state === 'todo' ? ' mk-step--todo' : ''}`}
          aria-current={s.state === 'current' ? 'step' : undefined}
        >
          <span className="mk-step__dot" aria-hidden="true" />
          <div>
            <div className="mk-step__title">{s.title}</div>
            {s.meta && <div className="mk-step__meta mk-num">{s.meta}</div>}
            {s.note && <p className="mk-step__note">{s.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
