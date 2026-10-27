import { useAsync } from '@/shared/lib';
import { fetchApplication, fetchApplications } from '../api/applicationApi';

export const useApplications = () => useAsync(fetchApplications, []);
export const useApplication = (id: string) => useAsync(() => fetchApplication(id), [id]);
