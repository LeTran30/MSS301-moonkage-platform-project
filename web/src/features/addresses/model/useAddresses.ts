import { useAsync } from '../../../shared/ui';
import {
  deleteAddress,
  fetchAddress,
  fetchAddresses,
  formatAddress,
  saveAddress,
  setDefaultAddress,
  type Address,
} from '../api/addressesApi';

export type { Address };
export { deleteAddress, formatAddress, saveAddress, setDefaultAddress };

export const useAddresses = () => useAsync(fetchAddresses, []);
export const useAddress = (id: string) => useAsync(() => fetchAddress(id), [id]);
