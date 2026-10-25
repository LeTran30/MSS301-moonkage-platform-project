import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { guideStrings as s } from '../strings';

/** M3.0: the two ways to order to request, each with when to choose it and its real conditions. */
export function CustomOrderIntro() {
  const targets = [routes.newQuoteRequest, routes.suppliers];
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="title-text">{s.customTitle}</h1>
          <p className="lead-text">{s.customLead}</p>
        </div>
      </header>
      <div className="grid-2">
        {s.entries.map((e, i) => (
          <article key={e.title} className="panel entry-card">
            <span className="eyebrow">{e.eyebrow}</span>
            <h2 className="heading-text">{e.title}</h2>
            <p>
              <strong>{s.whenLabel}</strong> {e.when}
            </p>
            <ul className="cond-list">
              {e.conds.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <Link to={targets[i]} className={`mk-btn ${i === 0 ? 'mk-btn--primary' : 'mk-btn--quiet'}`}>
              {e.cta}
            </Link>
          </article>
        ))}
      </div>
      <section aria-labelledby="after-heading" className="stack">
        <h2 id="after-heading" className="heading-text">
          {s.afterTitle}
        </h2>
        <ol className="step-row">
          {s.after.map((step, i) => (
            <li key={step}>
              <span className="step-row__n mk-num">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
