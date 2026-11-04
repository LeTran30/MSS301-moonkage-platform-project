import { useCallback } from 'react';
import { login } from '../api/loginApi';
import { userStore } from '@/entities/user';

/**
 * Sign in and start the session.
 *
 * The page owns the form; this model owns the write, so the page never calls
 * an API directly (package-architecture §3, "Tầng 1: pages").
 */
export function useLogin() {
  return useCallback(async (phone: string, password: string) => {
    const user = await login(phone, password);
    userStore.set(user);
    return user;
  }, []);
}
