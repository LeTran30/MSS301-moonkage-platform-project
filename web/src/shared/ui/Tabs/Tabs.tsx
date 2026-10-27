import { useId, type ReactNode } from 'react';
import styles from './Tabs.module.css';

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
    <div className={styles.tabs} role="group" aria-label={label}>
      {tabs.map((t) => (
        <button key={t.key} type="button" className="mk-chip" aria-pressed={t.key === current} onClick={() => onChange(t.key)}>
          {t.label}
          {t.count !== undefined && <span className={`${styles.count} mk-num`}> {t.count}</span>}
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
    <div className={styles.sectionTabs}>
      <div role="tablist" className={styles.tabList}>
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            id={`${id}-${t.key}`}
            aria-selected={t.key === current}
            aria-controls={`${id}-panel`}
            className={styles.tab}
            onClick={() => onChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${current}`}>
        {children}
      </div>
    </div>
  );
}
