import { Outlet } from 'react-router-dom';
import { Header } from '@/widgets/header';
import { SidebarDrawer, VendorSidebar, VendorSidebarContent } from '@/widgets/sidebar';
import { useCurrentUser } from '@/entities/user';
import { useMyVendorDetail, useMyVendorId } from '@/entities/vendor';
import { CommandPalette } from '@/widgets/command-palette';
import { LayoutErrorBoundary } from '../LayoutErrorBoundary';
import styles from './VendorLayout.module.css';

export function VendorLayout() {
  const user = useCurrentUser();
  const hasShop = user.hasShop !== false;
  const acceptsCustomOrders = user.acceptsCustomOrders !== false;
  const asyncVendorId = useMyVendorId();
  const asyncVendor = useMyVendorDetail(
    asyncVendorId.kind === 'loaded' ? asyncVendorId.data : null,
  );
  // Chưa tải xong thì giữ menu đầy đủ, để Shop đang bán không thấy menu nhảy.
  const canOperate = asyncVendor.kind === 'loaded' ? Boolean(asyncVendor.data?.canOperate) : true;

  return (
    <div className={styles.layout} data-zone="vendor">
      <Header zone="vendor" />
      <div className={styles.body}>
        <VendorSidebar
          hasShop={hasShop}
          acceptsCustomOrders={acceptsCustomOrders}
          canOperate={canOperate}
        />
        <div className={styles.contentCol}>
          <div className={styles.mobileBar}>
            <SidebarDrawer title="Kênh người bán" panelId="vendor-sidebar-drawer" zone="vendor">
              {(onNavigate) => (
                <VendorSidebarContent
                  hasShop={hasShop}
                  acceptsCustomOrders={acceptsCustomOrders}
                  canOperate={canOperate}
                  onNavigate={onNavigate}
                  showHeader={false}
                />
              )}
            </SidebarDrawer>
            <span className={styles.mobileBarLabel}>Kênh người bán</span>
          </div>
          <main className={styles.content}>
            <LayoutErrorBoundary areaName="Kênh Người Bán">
              <Outlet />
            </LayoutErrorBoundary>
          </main>
        </div>
      </div>
      <CommandPalette />
    </div>
  );
}
