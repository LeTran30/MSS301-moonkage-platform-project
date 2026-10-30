export type NfcStatus = 'NOT_VERIFIED' | 'VERIFIED' | 'LOCKED';

export interface NfcStatusInfo {
  nfcStatus: NfcStatus;
  legalName: string | null;
  idNumberMasked: string | null;
  nfcVerifiedAt: string | null;
}
