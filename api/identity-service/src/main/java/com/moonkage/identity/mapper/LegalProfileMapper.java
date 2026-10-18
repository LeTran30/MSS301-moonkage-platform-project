package com.moonkage.identity.mapper;

import com.moonkage.identity.dto.response.IdNumberCheckResponse;
import com.moonkage.identity.dto.response.NfcStatusResponse;
import com.moonkage.identity.entity.LegalProfile;
import com.moonkage.identity.enums.NfcStatus;

/** LegalProfile → internal API responses. Only the masked number ever leaves (NFR-03). */
public final class LegalProfileMapper {

    private LegalProfileMapper() {}

    public static NfcStatusResponse toVerifiedStatus(LegalProfile profile) {
        return new NfcStatusResponse(
                NfcStatus.VERIFIED, profile.getLegalName(), profile.getIdNumberMasked(), profile.getNfcVerifiedAt());
    }

    /** NOT_VERIFIED or LOCKED: nothing from a card to show. */
    public static NfcStatusResponse toUnverifiedStatus(NfcStatus status) {
        return new NfcStatusResponse(status, null, null, null);
    }

    /** {@code owner} null when the account is not NFC-verified: the owner fields stay null. */
    public static IdNumberCheckResponse toIdNumberCheck(
            String idHash, int idHashKeyVer, String idMasked, boolean matchesAccount, LegalProfile owner) {
        return owner == null
                ? new IdNumberCheckResponse(idHash, idHashKeyVer, idMasked, false, null, null, null)
                : new IdNumberCheckResponse(
                        idHash,
                        idHashKeyVer,
                        idMasked,
                        matchesAccount,
                        owner.getLegalName(),
                        owner.getIdNumberMasked(),
                        owner.getNfcVerifiedAt());
    }
}
