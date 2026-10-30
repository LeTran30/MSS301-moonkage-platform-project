import { Outlet, ScrollRestoration } from 'react-router-dom';
import { RequireAdmin } from '@/entities/user';
import { AdminBar } from '@/widgets/admin-bar';

/** Frame of Quản trị: admin accounts only (RequireAdmin), AdminBar widget, main content. */
export function AdminLayout() {
  return (
    <RequireAdmin>
      <div className="shop">
        <ScrollRestoration />
        <AdminBar />
        <main className="shop__inner page">
          <Outlet />
        </main>
      </div>
    </RequireAdmin>
  );
}
