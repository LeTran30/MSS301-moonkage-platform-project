package com.moonkage.identity.kyc.domain.nfc;

import com.moonkage.identity.shared.value.Text;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * The id of an NFC session. A capability, not a name: whoever holds it may send a card, so it cannot be guessed and
 * stays out of logs (plan v2, 5.5.2, B-2).
 */
public record NfcSessionId(String value) {

    /** 192 bits, 32 base64url characters: within the 16-128 the app accepts (Software Design 5.1). */
    private static final int RANDOM_BYTES = 24;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();

    public NfcSessionId {
        Text.assertPresent(value, "NFC session id");
    }

    public static NfcSessionId generate() {
        byte[] bytes = new byte[RANDOM_BYTES];
        RANDOM.nextBytes(bytes);
        return new NfcSessionId(ENCODER.encodeToString(bytes));
    }

    @Override
    public String toString() {
        return Text.HIDDEN;
    }
}
