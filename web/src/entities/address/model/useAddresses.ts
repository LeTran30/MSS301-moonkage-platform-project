import { useAsync } from '@/shared/lib';
import { fetchAddress, fetchAddresses } from '../api/addressApi';

export const useAddresses = () => useAsync(fetchAddresses, []);
export const useAddress = (id: string) => useAsync(() => fetchAddress(id), [id]);
