package com.moonkage.identity.profile.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.profile.FullName;
import com.moonkage.identity.profile.IdNumberHash;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.LegalName;
import com.moonkage.identity.shared.MaskedIdNumber;
import com.moonkage.identity.shared.value.ValueRejected;
import java.util.Optional;
import org.junit.jupiter.api.Test;

/** FR-01, FR-04: a profile starts without KYC and gets its legal identity exactly once. */
class ProfileTest {

    private static final AccountId ID =
            AccountId.tryParse("6f1c2a4e-8d3b-4f7a-9c21-5b0e7d9a3f10").orElseThrow();
    private static final LegalIdentity IDENTITY = new LegalIdentity(
            new LegalName("NGUYEN VAN A"),
            new IdNumberHash("a".repeat(IdNumberHash.LENGTH)),
            1,
            MaskedIdNumber.of("079123456789"));

    @Test
    void newProfileHasNoLegalIdentity() {
        Profile profile = Profile.create(ID, new FullName("Nguyen Lan"));

        assertEquals(ID, profile.accountId());
        assertFalse(profile.isKycVerified());
        assertEquals(Optional.empty(), profile.legalIdentity());
    }

    @Test
    void legalIdentityIsWrittenOnce() {
        Profile profile = Profile.create(ID, new FullName("Nguyen Lan"));

        profile.completeKyc(IDENTITY);

        assertTrue(profile.isKycVerified());
        assertEquals(Optional.of(IDENTITY), profile.legalIdentity());
        assertThrows(IllegalStateException.class, () -> profile.completeKyc(IDENTITY));
    }

    @Test
    void valuesOfTheProfileKeepTheirRules() {
        assertEquals("Nguyen Lan", FullName.parse("  Nguyen Lan ").value());
        assertEquals(ValueRejected.Reason.TOO_LONG, rejected(() -> FullName.parse("x".repeat(101))));
        assertEquals(ValueRejected.Reason.REQUIRED, rejected(() -> FullName.parse(" ")));
        assertEquals("********6789", MaskedIdNumber.of("079123456789").value());
        assertThrows(IllegalArgumentException.class, () -> new IdNumberHash("A".repeat(IdNumberHash.LENGTH)));
        assertThrows(IllegalArgumentException.class, () -> new MaskedIdNumber("079123456789"));
        assertThrows(
                IllegalArgumentException.class,
                () -> new LegalIdentity(IDENTITY.legalName(), IDENTITY.idNumberHash(), 0, IDENTITY.idNumberMasked()));
        // the legal name and the fingerprint stay out of logs
        assertEquals("LegalIdentity[********6789]", IDENTITY.toString());
    }

    private static ValueRejected.Reason rejected(Runnable parse) {
        return assertThrows(ValueRejected.class, parse::run).reason();
    }
}
