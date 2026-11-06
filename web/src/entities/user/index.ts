export type { NfcVerificationStatus, User, UserRole } from './model/types';
export { GUEST_USER } from './model/types';
export { setNfcVerified, useCurrentUser, userStore } from './model/userStore';
export {
  markAnonymous,
  markAuthenticated,
  markRestoring,
  sessionStatusStore,
  useIsRestoringSession,
  useSessionStatus,
  type SessionStatus,
} from './model/sessionStatusStore';
export { enrichSessionProfile } from './model/sessionProfile';
export {
  clearTokens,
  getAccessToken,
  mapAccountToUser,
  mapRole,
  sessionApi,
  storeTokens,
} from './api/sessionApi';
export type { AccountDto } from './api/sessionApi';
export type { LoginDto, RegisterDto, VerifyAccountDto } from './api/dto';
export { NFC_REASON_MESSAGES, nfcApi } from './api/nfcApi';
export type {
  CreateNfcSessionDto,
  NfcReasonCode,
  NfcSessionStatusDto,
  NfcStatusDto,
} from './api/nfcApi';
export { useNfcSession, useNfcStatus } from './model/useNfcQueries';
