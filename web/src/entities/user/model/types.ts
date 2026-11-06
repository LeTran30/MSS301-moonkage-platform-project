export type UserRole = 'GUEST' | 'BUYER' | 'VENDOR' | 'ADMIN';

export type NfcVerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'LOCKED';

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: UserRole;
  nfcStatus: NfcVerificationStatus;
  idCardNumberMasked?: string;
  vendorId?: string;
  vendorName?: string;
  hasShop?: boolean;
  acceptsCustomOrders?: boolean;
};

/**
 * The signed-out account.
 *
 * The store starts empty so the guards (`RequireAuth`, `RequireAdmin`) send a
 * guest to the sign-in page instead of letting them into a protected screen.
 */
export const GUEST_USER: User = {
  id: '',
  name: 'Khách',
  email: '',
  phone: '',
  role: 'GUEST',
  nfcStatus: 'UNVERIFIED',
};
