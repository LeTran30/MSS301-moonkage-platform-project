import { Outlet } from 'react-router-dom';
import { Header } from '@/widgets/header';
import { AdminSidebar, AdminSidebarContent, SidebarDrawer } from '@/widgets/sidebar';
import { CommandPalette } from '@/widgets/command-palette';
import { LayoutErrorBoundary } from '../LayoutErrorBoundary';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  return (
    <div className={styles.layout} data-zone="admin">
      <Header />
      <div className={styles.body}>
        <AdminSidebar />
        <div className={styles.contentCol}>
          <div className={styles.mobileBar}>
            <SidebarDrawer title="Quản trị" panelId="admin-sidebar-drawer" zone="admin">
              {(onNavigate) => (
                <AdminSidebarContent onNavigate={onNavigate} showHeader={false} />
              )}
            </SidebarDrawer>
            <span className={styles.mobileBarLabel}>Quản trị hệ thống</span>
          </div>
          <main className={styles.content}>
            <LayoutErrorBoundary areaName="Quản Trị Hệ Thống">
              <Outlet />
            </LayoutErrorBoundary>
          </main>
        </div>
      </div>
      <CommandPalette />
    </div>
  );
}
