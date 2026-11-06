import { describe, it, expect, vi, beforeEach } from 'vitest';
import { declineInvitation } from '../declineInvitationApi';
import * as envModule from '@/shared/config/env';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature decline-invitation - declineInvitationApi (AC-36.3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);
  });

  it('gửi PATCH với status DECLINED đúng endpoint của lời mời', async () => {
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue(
      envelope({ vendorId: 'ven-1', status: 'DECLINED', declineReason: 'Không đủ năng lực' }) as never,
    );

    const invitation = await declineInvitation('req-1', 'ven-1', {
      status: 'DECLINED',
      declineReason: 'Không đủ năng lực',
    });

    expect(patch).toHaveBeenCalledWith(
      '/quotation-service/api/quote-requests/req-1/invitations/ven-1',
      { status: 'DECLINED', declineReason: 'Không đủ năng lực' },
    );
    expect(invitation?.status).toBe('DECLINED');
  });
});
