import { config } from '../../../shared/config/env';
import { DEMO_PASSWORD, demoAccounts } from '../api/demoAccounts';
import { authStrings } from '../strings';

/** Demo mode only: the seed accounts, one click fills the form. */
export function DemoAccounts({ onPick }: { onPick: (username: string, password: string) => void }) {
  if (!config.demoMode) return null;
  return (
    <section className="demo-accounts" aria-labelledby="demo-heading">
      <h2 id="demo-heading" className="demo-accounts__title">
        {authStrings.demoTitle}
      </h2>
      <p className="muted">{authStrings.demoHint(DEMO_PASSWORD)}</p>
      <ul className="demo-accounts__list">
        {demoAccounts.map((a) => (
          <li key={a.username}>
            <button type="button" className="demo-accounts__item" onClick={() => onPick(a.username, DEMO_PASSWORD)}>
              <span className="demo-accounts__label">{a.label}</span>
              <span className="muted">{a.username}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
