import { useAsync } from '@/shared/lib';
import { fetchDispute, fetchDisputes } from '../api/disputeApi';

export const useDisputes = () => useAsync(fetchDisputes, []);
export const useDispute = (id: string) => useAsync(() => fetchDispute(id), [id]);
