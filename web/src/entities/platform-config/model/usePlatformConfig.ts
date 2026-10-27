import { useAsync } from '@/shared/lib';
import { fetchProvinceFees, fetchTaxonomy, fetchVendorFee } from '../api/platformConfigApi';

export const useProvinceFees = () => useAsync(fetchProvinceFees, []);
export const useVendorFeeConfig = () => useAsync(fetchVendorFee, []);
export const useTaxonomy = () => useAsync(fetchTaxonomy, []);
