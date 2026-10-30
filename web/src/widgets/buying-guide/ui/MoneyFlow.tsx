import { SectionHeader } from '@/shared/ui';
import { guideStrings as s } from '../strings';
import styles from './MoneyFlow.module.css';

/**
 * "Tiền của bạn đi thế nào": only rules the spec states (VNPay, deposit held, mockup approval, rest after delivery).
 * Three ruled columns with a step label, not three icon cards (DS: no feature grid with round icons).
 */
export function MoneyFlow() {
  return (
    <section aria-labelledby="money-heading">
      <SectionHeader id="money-heading" title={s.moneyTitle} />
      <ol className={styles.grid}>
        {s.money.map((m, i) => (
          <li key={m.title} className={styles.item}>
            <span className={`${styles.step} mk-num`}>{s.step(i + 1)}</span>
            <h3 className={styles.title}>{m.title}</h3>
            <p className={styles.body}>{m.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
