package com.moonkage.identity.profile.domain;

import com.moonkage.identity.profile.IdNumberHash;
import com.moonkage.identity.shared.LegalName;
import com.moonkage.identity.shared.MaskedIdNumber;
import java.util.Objects;

/**
 * Who a person is by law, as their ID card proved it during KYC (FR-04). Only what someone reads back is kept: the
 * full number, birth date and the other card fields are dropped after the checks (db-identify.md).
 *
 * @param hashKeyVersion the pepper version {@code idNumberHash} was made with
 */
public record LegalIdentity(
        LegalName legalName, IdNumberHash idNumberHash, int hashKeyVersion, MaskedIdNumber idNumberMasked) {

    public LegalIdentity {
        Objects.requireNonNull(legalName, "legalName");
        Objects.requireNonNull(idNumberHash, "idNumberHash");
        Objects.requireNonNull(idNumberMasked, "idNumberMasked");
        if (hashKeyVersion < 1) {
            throw new IllegalArgumentException("hash key version < 1: " + hashKeyVersion);
        }
    }

    /** Whether a number hashed with {@code keyVersion} is the number on this card (BR-27). */
    public boolean matches(IdNumberHash hash, int keyVersion) {
        return keyVersion == hashKeyVersion && idNumberHash.sameAs(hash);
    }

    /** Masked data only: the legal name and the fingerprint stay out of logs. */
    @Override
    public String toString() {
        return "LegalIdentity[" + idNumberMasked.value() + "]";
    }
}
