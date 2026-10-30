import { createContext, useContext } from 'react';

export type VendorStatus = 'none' | 'pending' | 'open';

export interface UserSession {
  token: string;
  refreshToken?: string;
  accountId: string;
  email?: string;
  /** Shown in the header; the login name when the account has no full name. */
  displayName: string;
  /**
   * Vendor profile of the account: none, submitted and waiting, or open for sale.
   */
  vendorStatus: VendorStatus;
  /** Admin accounts are internal: they see the public pages and the admin area, never a cart or account. */
  isAdmin: boolean;
}

export interface UserContextValue {
  session: UserSession | null;
  /** Stores a new session; resolves the vendor status first when it is not given. */
  startSession: (next: Omit<UserSession, 'vendorStatus'> & { vendorStatus?: VendorStatus }) => Promise<void>;
  logout: () => void;
  refreshVendorStatus?: () => Promise<void>;
  updateDisplayName?: (displayName: string) => void;
}

export const UserContext = createContext<UserContextValue | null>(null);

export function useCurrentUser(): UserSession | null {
  const value = useContext(UserContext);
  if (!value) throw new Error('useCurrentUser must be used inside <SessionProvider>');
  return value.session;
}

export function hasRole(session: UserSession | null, role: 'admin' | 'vendor' | 'buyer'): boolean {
  if (!session) return false;
  if (role === 'admin') return session.isAdmin;
  if (role === 'vendor') return session.vendorStatus === 'open';
  return !session.isAdmin;
}

export function useSession(): UserContextValue {
  const value = useContext(UserContext);
  if (!value) throw new Error('useSession must be used inside <SessionProvider>');
  return value;
}
