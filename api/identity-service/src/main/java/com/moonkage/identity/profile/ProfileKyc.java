package com.moonkage.identity.profile;

import com.moonkage.identity.shared.LegalName;
import com.moonkage.identity.shared.MaskedIdNumber;
import java.util.Objects;

/**
 * The KYC standing of a profile (BR-23, AC-45.1). Masked data only.
 *
 * @param legalName null unless VERIFIED
 * @param idNumberMasked null unless VERIFIED
 */
public record ProfileKyc(KycStatus status, LegalName legalName, MaskedIdNumber idNumberMasked) {

    public ProfileKyc {
        Objects.requireNonNull(status, "status");
        if ((status == KycStatus.VERIFIED) != (legalName != null && idNumberMasked != null)) {
            throw new IllegalArgumentException("a verified KYC, and only it, carries the card's name and number");
        }
    }

    public static ProfileKyc verified(LegalName legalName, MaskedIdNumber idNumberMasked) {
        return new ProfileKyc(KycStatus.VERIFIED, legalName, idNumberMasked);
    }

    public static ProfileKyc unverified(boolean locked) {
        return new ProfileKyc(locked ? KycStatus.LOCKED : KycStatus.NOT_VERIFIED, null, null);
    }

    public boolean isVerified() {
        return status == KycStatus.VERIFIED;
    }
}
