import { guideStrings as s } from '../strings';

/**
 * "Tiền của bạn đi thế nào": only rules the spec states (VNPay, deposit held, mockup approval, rest after delivery).
 * Three ruled columns with a step label, not three icon cards (DS: no feature grid with round icons).
 */
export function MoneyFlow() {
  return (
    <section aria-labelledby="money-heading">
      <div className="mk-section-head">
        <h2 id="money-heading">{s.moneyTitle}</h2>
      </div>
      <ol className="money-flow">
        {s.money.map((m, i) => (
          <li key={m.title} className="money-flow__item">
            <span className="money-flow__step mk-num">{s.step(i + 1)}</span>
            <h3 className="money-flow__title">{m.title}</h3>
            <p className="money-flow__body">{m.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
