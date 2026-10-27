import type { ReactNode } from 'react';
import styles from './CenteredScreen.module.css';

/** A full-height muted screen with its content centred: the auth forms and the config error. */
export function CenteredScreen({ children }: { children: ReactNode }) {
  return <main className={styles.screen}>{children}</main>;
}
