import { useCallback } from 'react';
import {
  declineInvitation,
  type DeclineInvitationPayload,
} from '../api/declineInvitationApi';
import type { InvitationDto } from '@/entities/request';

/**
 * The vendor declines an invitation (AC-36.3).
 */
export function useDeclineInvitation() {
  return useCallback(
    (
      requestId: string,
      vendorId: string,
      payload?: DeclineInvitationPayload,
    ): Promise<InvitationDto | null> => declineInvitation(requestId, vendorId, payload),
    [],
  );
}
