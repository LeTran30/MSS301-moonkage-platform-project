import { Outlet } from 'react-router-dom';
import { Header } from '@/widgets/header';
import { AdminSidebar } from '@/widgets/sidebar';
import { CommandPalette } from '@/widgets/command-palette';
import { LayoutErrorBoundary } from '../LayoutErrorBoundary';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  return (
    <div className={styles.layout} data-zone="admin">
      <Header />
      <div className={styles.body}>
        <AdminSidebar />
        <main className={styles.content}>
          <LayoutErrorBoundary areaName="Quản Trị Hệ Thống">
            <Outlet />
          </LayoutErrorBoundary>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
