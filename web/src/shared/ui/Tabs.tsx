import { useId, type ReactNode } from 'react';

/** Tabs as DS chips: one row of toggles above a panel. `count` shows after the label. */
export function Tabs<K extends string>({
  tabs,
  current,
  onChange,
  label,
}: {
  tabs: { key: K; label: string; count?: number }[];
  current: K;
  onChange: (key: K) => void;
  label: string;
}) {
  return (
    <div className="tabs" role="group" aria-label={label}>
      {tabs.map((t) => (
        <button key={t.key} type="button" className="mk-chip" aria-pressed={t.key === current} onClick={() => onChange(t.key)}>
          {t.label}
          {t.count !== undefined && <span className="tabs__count mk-num"> {t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Underlined section switcher inside a page (order detail: Maket / Tiến độ / Thanh toán). */
export function SectionTabs<K extends string>({
  tabs,
  current,
  onChange,
  children,
}: {
  tabs: { key: K; label: string }[];
  current: K;
  onChange: (key: K) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="section-tabs">
      <div role="tablist" className="section-tabs__list">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            id={`${id}-${t.key}`}
            aria-selected={t.key === current}
            aria-controls={`${id}-panel`}
            className="section-tabs__tab"
            onClick={() => onChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${current}`} className="section-tabs__panel">
        {children}
      </div>
    </div>
  );
}
