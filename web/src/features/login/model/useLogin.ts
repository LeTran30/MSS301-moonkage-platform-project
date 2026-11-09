import { useCallback } from 'react';
import { login } from '../api/loginApi';
import { enrichSessionProfile, markAuthenticated, userStore } from '@/entities/user';

export function useLogin() {
  return useCallback(async (phone: string, password: string) => {
    const signedIn = await login(phone, password);
    const user = await enrichSessionProfile(signedIn);
    userStore.set(user);
    markAuthenticated();
    return user;
  }, []);
}
