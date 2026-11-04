import { Outlet } from 'react-router-dom';
import { Header } from '@/widgets/header';
import { VendorSidebar } from '@/widgets/sidebar';
import { useCurrentUser } from '@/entities/user';
import { CommandPalette } from '@/widgets/command-palette';
import { LayoutErrorBoundary } from '../LayoutErrorBoundary';
import styles from './VendorLayout.module.css';

export function VendorLayout() {
  const user = useCurrentUser();

  return (
    <div className={styles.layout} data-zone="vendor">
      <Header />
      <div className={styles.body}>
        <VendorSidebar
          hasShop={user.hasShop !== false}
          acceptsCustomOrders={user.acceptsCustomOrders !== false}
        />
        <main className={styles.content}>
          <LayoutErrorBoundary areaName="Kênh Người Bán">
            <Outlet />
          </LayoutErrorBoundary>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
