package com.moonkage.identity.kyc.infrastructure.crypto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.moonkage.identity.kyc.domain.CitizenId;
import org.junit.jupiter.api.Test;

class HmacIdNumberHasherTest {

    private static final CitizenId ID_NUMBER = CitizenId.parse("079123456789");

    @Test
    void hashIsHmacSha256Hex() {
        // known answer, also what encode(hmac(id, pepper, 'sha256'), 'hex') in db/seed/R__seed.sql gives
        assertEquals(
                "4b3d50efbfd51c82bbf4f9fcccbf91c113d7fdfadc3e5a3d9a22341bb6f6f9aa",
                new HmacIdNumberHasher("key").hash(ID_NUMBER).value());
        assertEquals(1, new HmacIdNumberHasher("key").keyVersion());
    }

    @Test
    void sameNumberSameFingerprintButOnlyWithTheSamePepper() {
        HmacIdNumberHasher hasher = new HmacIdNumberHasher("pepper-a");

        assertEquals(hasher.hash(ID_NUMBER), hasher.hash(CitizenId.parse("079123456789")));
        assertNotEquals(hasher.hash(ID_NUMBER), new HmacIdNumberHasher("pepper-b").hash(ID_NUMBER));
    }

    @Test
    void missingPepperFailsOnUse() {
        assertThrows(IllegalStateException.class, () -> new HmacIdNumberHasher("").hash(ID_NUMBER));
    }
}
