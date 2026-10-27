import { useAsync } from '@/shared/lib';
import { fetchProfile } from '../api/vendorProfileApi';

export const useVendorProfile = () => useAsync(fetchProfile, []);
