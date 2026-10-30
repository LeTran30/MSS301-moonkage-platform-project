import { config } from '../config/env';

/** identity-service is reached through the gateway under its service id (D-1, D-18). */
export const identityApi = '/identity-service/api';

/** vendor-service aggregate roots exposed directly on the gateway (L-17). */
export const vendorsApi = '/api/vendors';
export const registrationFeeConfigApi = '/api/registration-fee-config';
export const cakeAttributesApi = '/api/cake-attributes';

/** catalog-service read endpoints and interprovince fee table. */
export const catalogProductsApi = '/catalog-service/api/products';
export const interprovinceFeesApi = '/api/interprovince-fees';

/** quotation-service endpoints through the gateway discovery locator. */
export const quotationApi = '/quotation-service/api';
export const quoteRequestsApi = `${quotationApi}/quote-requests`;
export const vendorDirectoryApi = `${quotationApi}/vendors`;

/** order-service, payment-service and orchestrator-service REST roots. */
export const ordersApi = '/order-service/api';
export const paymentsApi = '/payment-service/api';
export const notificationsApi = '/orchestrator-service/api/notifications';

/** STOMP over WebSocket of orchestrator-service, through the gateway; the token goes in the CONNECT frame. */
export const realtimePath = '/ws';

/** ws(s):// URL of a gateway path, from VITE_API_BASE_URL. */
export function websocketUrl(path: string): string {
  const url = new URL(path, config.apiBaseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}
