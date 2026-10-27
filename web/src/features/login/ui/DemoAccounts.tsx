import { DEMO_PASSWORD, demoAccounts } from '@/entities/user';
import { config } from '@/shared/config/env';
import { loginStrings } from '../strings';
import styles from './DemoAccounts.module.css';

/** Demo mode only: the seed accounts, one click fills the form. */
export function DemoAccounts({ onPick }: { onPick: (username: string, password: string) => void }) {
  if (!config.demoMode) return null;
  return (
    <section className={styles.section} aria-labelledby="demo-heading">
      <h2 id="demo-heading" className={styles.title}>
        {loginStrings.demoTitle}
      </h2>
      <p className="muted">{loginStrings.demoHint(DEMO_PASSWORD)}</p>
      <ul className={styles.list}>
        {demoAccounts.map((a) => (
          <li key={a.username}>
            <button type="button" className={styles.item} onClick={() => onPick(a.username, DEMO_PASSWORD)}>
              <span className={styles.label}>{a.label}</span>
              <span className="muted">{a.username}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
