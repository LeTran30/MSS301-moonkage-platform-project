import { useAsync } from '@/shared/lib';
import { fetchRequest, fetchRequests } from '../api/quoteApi';

export function useRequests() {
  return useAsync(fetchRequests, []);
}

export function useRequest(requestId: string) {
  return useAsync(() => fetchRequest(requestId), [requestId]);
}
