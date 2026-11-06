import { type ReactNode, useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from '@/shared/ui';
import { useProductCatalog, useTaxonomyCatalog } from '@/entities/product';
import { useVendorCatalog } from '@/entities/vendor';
import { useDeliveryProvinceCode } from '@/entities/region';
import { useNotificationPush } from '@/entities/notification';
import { RealtimeProvider } from '@/shared/api/realtime';
import { queryClient } from '@/shared/api';
import { subscribeToToken } from '@/shared/api/tokenVault';
import { IdentityBridge } from './IdentityBridge';
import { SessionBridge } from './SessionBridge';

interface Props {
  children: ReactNode;
}

/**
 * The catalogues the whole app reads: the products of `catalog-service`, the
 * crust/filling taxonomy of `vendor-service` and the suppliers of
 * `quotation-service`.
 *
 * They are loaded once here so every screen (home, catalogue, shop page) shows
 * the same, server-backed data. A failing call leaves the store empty and the
 * screen that asked for the data shows its own error state.
 */
function CatalogBootstrap() {
  const provinceCode = useDeliveryProvinceCode();
  useProductCatalog(provinceCode);
  useTaxonomyCatalog();
  useVendorCatalog();
  return null;
}

/**
 * One STOMP connection for the signed-in account.
 *
 * The token lives in the token vault (module memory, mirrored into
 * sessionStorage), so the provider subscribes to it: the socket opens when a
 * session starts and closes when it ends. A guest gets no socket: the screens
 * poll.
 */
function SessionRealtime({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToToken(setToken);
  }, []);

  return (
    <RealtimeProvider token={token}>
      <NotificationPushBridge />
      {children}
    </RealtimeProvider>
  );
}

/**
 * Nhận thông báo đẩy của orchestrator-service (NFR-10).
 *
 * `useNotificationPush` phải nằm trong `RealtimeProvider` vì nó dùng chính
 * socket đó; nó nạp ở đây một lần nên chuông và trang thông báo đọc cùng một
 * kho dữ liệu.
 */
function NotificationPushBridge() {
  useNotificationPush();
  return null;
}

/**
 * AppProviders tập trung các provider toàn cục của ứng dụng:
 * - Query cache (React Query) — một nguồn dữ liệu duy nhất cho toàn ứng dụng
 * - Hệ thống Toast thông báo
 * - Kết nối realtime của phiên đăng nhập
 * - Nạp danh mục từ backend một lần cho toàn ứng dụng
 */
export function AppProviders({ children }: Props) {
  useEffect(() => {
    document.documentElement.dataset.appReady = 'true';
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionBridge />
      <CatalogBootstrap />
      <SessionRealtime>{children}</SessionRealtime>
      <ToastContainer />
      {/* Observability: định danh tài khoản cho lỗi + sự kiện. */}
      <IdentityBridge />
    </QueryClientProvider>
  );
}
