import { useAsync } from '../../../shared/ui';
import { fetchAddress, fetchAddresses } from '../api/addressesApi';

export const useAddresses = () => useAsync(fetchAddresses, []);
export const useAddress = (id: string) => useAsync(() => fetchAddress(id), [id]);
