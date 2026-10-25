import { useAsync } from '../../../shared/ui';
import {
  fetchDisbursements,
  fetchIncoming,
  fetchIncomingRequest,
  fetchInterProvinceFees,
  fetchProfile,
  fetchSellerOrder,
  fetchSellerOrders,
  fetchSellerProduct,
  fetchSellerProducts,
  fetchSettlements,
  fetchShopNotifications,
  fetchTerms,
  fetchZones,
} from '../api/sellerApi';

export const useSellerProfile = () => useAsync(fetchProfile, []);
export const useSellerOrders = () => useAsync(fetchSellerOrders, []);
export const useSellerOrder = (id: string) => useAsync(() => fetchSellerOrder(id), [id]);
export const useIncomingRequests = () => useAsync(fetchIncoming, []);
export const useIncomingRequest = (id: string) => useAsync(() => fetchIncomingRequest(id), [id]);
export const useSellerProducts = () => useAsync(fetchSellerProducts, []);
export const useSellerProduct = (id: string) => useAsync(() => fetchSellerProduct(id), [id]);
export const useSettlements = () => useAsync(fetchSettlements, []);
export const useDisbursements = () => useAsync(fetchDisbursements, []);
export const useZones = () => useAsync(fetchZones, []);
export const useInterProvinceFees = () => useAsync(fetchInterProvinceFees, []);
export const useTerms = () => useAsync(fetchTerms, []);
export const useShopNotifications = () => useAsync(fetchShopNotifications, []);
