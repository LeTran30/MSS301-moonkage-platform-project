import { useAsync } from '@/shared/lib';
import { fetchVendorOrder, fetchVendorOrders } from '../api/vendorOrderApi';

export const useVendorOrders = () => useAsync(fetchVendorOrders, []);
export const useVendorOrder = (id: string) => useAsync(() => fetchVendorOrder(id), [id]);
