/** A row of numbered steps (checkout, deposit, seller profile); `current` is 0-based. */
export function Steps({ steps, current, label }: { steps: string[]; current: number; label: string }) {
  return (
    <ol className="steps-bar" aria-label={label}>
      {steps.map((step, i) => (
        <li
          key={step}
          className={`steps-bar__item${i < current ? ' is-done' : ''}`}
          aria-current={i === current ? 'step' : undefined}
        >
          <span className="steps-bar__n mk-num">{i < current ? '✓' : i + 1}</span>
          {step}
        </li>
      ))}
    </ol>
  );
}
