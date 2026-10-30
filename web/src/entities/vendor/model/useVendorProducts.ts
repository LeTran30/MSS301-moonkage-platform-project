import { useAsync } from '@/shared/lib';
import { fetchVendorProduct, fetchVendorProducts } from '../api/vendorProductApi';

export const useVendorProducts = () => useAsync(fetchVendorProducts, []);
export const useVendorProduct = (id: string) => useAsync(() => fetchVendorProduct(id), [id]);
