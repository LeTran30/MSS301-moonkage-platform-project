import { Link } from 'react-router-dom';
import { routes } from '@/shared/config/routes';
import { sellIntroStrings as s } from '../strings';
import styles from './SellIntro.module.css';

/** M7.0: can I sell here, how, and what to prepare. The start button goes through login and NFC gates. */
export function SellIntro() {
  return (
    <div className={`${styles.page} page sell-intro`}>
      <header className="page-head">
        <div>
          <h1 className="title-text">{s.introTitle}</h1>
          <p className="lead-text">{s.introLead}</p>
        </div>
        <Link to={routes.account.applyToSell} className="mk-btn mk-btn--primary">
          {s.start}
        </Link>
      </header>

      <section aria-labelledby="ways-heading" className="stack">
        <h2 id="ways-heading" className="heading-text">
          {s.waysTitle}
        </h2>
        <div className="grid-2">
          {s.ways.map((w) => (
            <article key={w.title} className="panel">
              <h3 className="card-title-text">{w.title}</h3>
              <p>{w.body}</p>
              <ul className="cond-list">
                {w.conds.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="steps-heading" className="stack">
        <h2 id="steps-heading" className="heading-text">
          {s.stepsTitle}
        </h2>
        <ol className={`${styles.stepRow} step-row`}>
          {s.steps.map((step, i) => (
            <li key={step}>
              <span className={`${styles.stepNumber} step-row__n mk-num`}>{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
        <p className="muted">{s.feeNote}</p>
      </section>

      <div className="grid-2">
        <section className="panel" aria-labelledby="prepare-heading">
          <h2 id="prepare-heading" className="card-title-text">
            {s.prepareTitle}
          </h2>
          <ul className="cond-list">
            {s.prepare.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
        <section className="panel panel--sunk" aria-labelledby="company-heading">
          <h2 id="company-heading" className="card-title-text">
            {s.companyTitle}
          </h2>
          <p>{s.companyBody}</p>
        </section>
      </div>
    </div>
  );
}
