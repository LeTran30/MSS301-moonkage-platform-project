import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/widgets/header';
import { Footer } from '@/widgets/footer';
import { CommandPalette } from '@/widgets/command-palette';
import { LayoutErrorBoundary } from '../LayoutErrorBoundary';
import styles from './BaseLayout.module.css';

export function BaseLayout({ children }: { children?: ReactNode }) {
  return (
    <div className={styles.layout} data-zone="base">
      <Header />
      <main className={styles.main}>
        <LayoutErrorBoundary areaName="Chung">
          {children ?? <Outlet />}
        </LayoutErrorBoundary>
      </main>
      <Footer />
      <CommandPalette />
    </div>
  );
}
