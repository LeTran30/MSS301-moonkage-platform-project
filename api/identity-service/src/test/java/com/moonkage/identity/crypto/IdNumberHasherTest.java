package com.moonkage.identity.crypto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class IdNumberHasherTest {

    @Test
    void hashIsHmacSha256Hex() {
        // known answer for HMAC-SHA256("key", ...)
        assertEquals(
                "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8",
                new IdNumberHasher("key").hash("The quick brown fox jumps over the lazy dog"));
    }

    @Test
    void sameNumberSameFingerprintButOnlyWithTheSamePepper() {
        IdNumberHasher hasher = new IdNumberHasher("pepper-a");

        assertEquals(hasher.hash("079123456789"), hasher.hash("079123456789"));
        assertNotEquals(hasher.hash("079123456789"), new IdNumberHasher("pepper-b").hash("079123456789"));
    }

    @Test
    void missingPepperFailsOnUse() {
        assertThrows(IllegalStateException.class, () -> new IdNumberHasher("").hash("079123456789"));
    }

    @Test
    void maskKeepsLastFourDigits() {
        assertEquals("********6789", IdNumberHasher.mask("079123456789"));
    }
}
