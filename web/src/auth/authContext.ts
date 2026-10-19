import { createContext } from 'react';

export interface AuthSession {
  token: string;
  accountId: string;
  /** Shown in the header; the login name when the account has no full name. */
  displayName: string;
}

export interface AuthContextValue {
  session: AuthSession | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
