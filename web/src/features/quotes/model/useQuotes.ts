import { useAsync } from '../../../shared/ui';
import { fetchRequest, fetchRequests } from '../api/quotesApi';

export function useRequests() {
  return useAsync(fetchRequests, []);
}

export function useRequest(requestId: string) {
  return useAsync(() => fetchRequest(requestId), [requestId]);
}
