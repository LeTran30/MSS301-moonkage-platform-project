import { Outlet, ScrollRestoration } from 'react-router-dom';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';
import styles from './BaseLayout.module.css';

/**
 * Frame of the base area on the DS NavBar: Header widget, main content, and Footer widget.
 */
export function BaseLayout() {
  return (
    <div className={styles.base}>
      <ScrollRestoration />
      <Header />

      <main className={styles.main}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
