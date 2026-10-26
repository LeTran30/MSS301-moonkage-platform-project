import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { routes } from '../shared/config/routes';

/** For actions that need an account (add to cart…): go to login, then come back to this page (AC-02.3). */
export function useLoginRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(
    () => navigate(routes.login, { state: { from: `${location.pathname}${location.search}` } }),
    [navigate, location],
  );
}
