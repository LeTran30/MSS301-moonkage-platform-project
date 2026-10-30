import { useAsync } from '@/shared/lib';
import { fetchInterProvinceFees, fetchTerms, fetchZones } from '../api/vendorSettingsApi';

export const useZones = () => useAsync(fetchZones, []);
export const useInterProvinceFees = () => useAsync(fetchInterProvinceFees, []);
export const useTerms = () => useAsync(fetchTerms, []);
