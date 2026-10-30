import { useAsync } from '@/shared/lib';
import { fetchIncoming, fetchIncomingRequest } from '../api/incomingApi';

export const useIncomingRequests = () => useAsync(fetchIncoming, []);
export const useIncomingRequest = (id: string) => useAsync(() => fetchIncomingRequest(id), [id]);

/** Time left to answer a request, as the vendor reads it. */
export const timeLeft = (h: number) => (h <= 0 ? 'Hết hạn' : h < 24 ? `Còn ${h} giờ` : `Còn ${Math.round(h / 24)} ngày`);
