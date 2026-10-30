import { mockResponse, seedStore } from '@/shared/api/mock';
import { seedDisputes } from './seed';


/** Complaints a buyer escalated, decided by an admin (Q5); demo data only. */
export const disputeStore = seedStore('admin-disputes', seedDisputes);

export const fetchDisputes = () => mockResponse(disputeStore.get());
export const fetchDispute = (id: string) => mockResponse(disputeStore.get().find((d) => d.id === id) ?? null);
