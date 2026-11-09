package com.moonkage.identity.kyc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import org.junit.jupiter.api.Test;

class PiiCipherTest {

    /** Throw-away test key: Base64 of the bytes 0x01..0x20. */
    static final String TEST_KEY = "AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA=";

    /** The properties with only the PII key set; the other keys are not used by the cipher. */
    private static NfcProperties propertiesWithPiiKey(String base64Key) {
        NfcProperties properties = new NfcProperties();
        properties.setPiiKey(base64Key);
        return properties;
    }

    private final PiiCipher cipher = new PiiCipher(propertiesWithPiiKey(TEST_KEY));

    @Test
    void roundTrip() {
        byte[] sealed = cipher.encrypt("079123456789");

        assertEquals("079123456789", cipher.decrypt(sealed));
        // the plaintext does not appear in the stored bytes
        assertFalse(new String(sealed, StandardCharsets.ISO_8859_1).contains("079123456789"));
    }

    @Test
    void sameValueEncryptsDifferentlyEachTime() {
        assertFalse(Arrays.equals(cipher.encrypt("x"), cipher.encrypt("x")));
    }

    @Test
    void tamperedValueDoesNotDecrypt() {
        byte[] sealed = cipher.encrypt("079123456789");
        sealed[sealed.length - 1] ^= 1;

        assertThrows(IllegalStateException.class, () -> cipher.decrypt(sealed));
    }

    @Test
    void anotherKeyDoesNotDecrypt() {
        byte[] sealed = cipher.encrypt("079123456789");
        PiiCipher other = new PiiCipher(propertiesWithPiiKey("ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0A="));

        assertThrows(IllegalStateException.class, () -> other.decrypt(sealed));
    }

    @Test
    void keyMustBeSetAnd32Bytes() {
        assertThrows(IllegalStateException.class, () -> new PiiCipher(propertiesWithPiiKey("")).encrypt("x"));
        assertThrows(IllegalStateException.class, () -> new PiiCipher(propertiesWithPiiKey("AQID")).encrypt("x"));
    }
}
