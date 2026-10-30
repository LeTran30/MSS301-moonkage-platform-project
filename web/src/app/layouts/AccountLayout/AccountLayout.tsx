import { Outlet } from 'react-router-dom';
import { AccountSidebar } from '@/widgets/account-sidebar';
import styles from './AccountLayout.module.css';

/** The account pages (M6.x): the AccountSidebar widget on the left, the page on the right. */
export function AccountLayout() {
  return (
    <div className={`${styles.layout} account-layout`}>
      <AccountSidebar />
      <div className={`${styles.main} account-layout__main`}>
        <Outlet />
      </div>
    </div>
  );
}
