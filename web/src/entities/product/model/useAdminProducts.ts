import { useAsync } from '@/shared/lib';
import { fetchAdminProducts } from '../api/adminProductApi';

export const useAdminProducts = () => useAsync(fetchAdminProducts, []);
