import { Outlet } from 'react-router-dom';
import { CenteredScreen } from '@/shared/ui';

/** Frame of the auth area (M5.x): the account card centred on a muted screen, no header or footer. */
export function AuthLayout() {
  return (
    <CenteredScreen>
      <Outlet />
    </CenteredScreen>
  );
}
