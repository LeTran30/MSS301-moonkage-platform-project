import { apiClient, GATEWAY, unwrap } from '@/shared/api';

import type { InvitationDto } from '@/entities/request';

/**
 * The write side of the vendor's answer to a request (AC-36.3).
 *
 * The request entity owns the read and the shape of the invitation; the write
 * lives here because it answers the invitation, not the invitation data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/**
 * Wire shape of `com.moonkage.quotation.dto.request.UpdateInvitationRequest`.
 *
 * The only change a vendor may make is `DECLINED`, with a reason.
 */
export interface DeclineInvitationPayload {
  status: 'DECLINED';
  declineReason?: string;
}

/**
 * The vendor declines an invitation (AC-36.3).
 */
export async function declineInvitation(
  requestId: string,
  vendorId: string,
  payload: DeclineInvitationPayload = { status: 'DECLINED' },
): Promise<InvitationDto | null> {
  const res = await apiClient.patch<unknown>(
    GATEWAY.QUOTATION.UPDATE_INVITATION(requestId, vendorId),
    payload,
  );
  const dto = unwrap<InvitationDto>(res);
  return dto ?? null;
}
