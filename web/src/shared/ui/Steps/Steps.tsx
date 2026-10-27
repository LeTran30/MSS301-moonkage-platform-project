import styles from './Steps.module.css';

/** A row of numbered steps (checkout, deposit, vendor profile); `current` is 0-based. */
export function Steps({ steps, current, label }: { steps: string[]; current: number; label: string }) {
  return (
    <ol className={styles.stepsBar} aria-label={label}>
      {steps.map((step, i) => {
        const isDone = i < current;
        const isCurrent = i === current;
        return (
          <li
            key={step}
            className={`${styles.item} ${isDone ? styles.done : ''} ${isCurrent ? styles.current : ''}`.trim()}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span
              className={`${styles.number} ${isDone ? styles.doneNumber : ''} ${isCurrent ? styles.currentNumber : ''} mk-num`.trim()}
            >
              {isDone ? '✓' : i + 1}
            </span>
            {step}
          </li>
        );
      })}
    </ol>
  );
}
