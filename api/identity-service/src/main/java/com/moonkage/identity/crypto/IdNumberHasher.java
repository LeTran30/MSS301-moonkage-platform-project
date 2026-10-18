package com.moonkage.identity.crypto;

import com.moonkage.identity.constant.IdCardConstant;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Fingerprint of an ID card number: HMAC-SHA256 with a secret pepper (NFR-03, D-07). A plain hash of 12 digits could
 * be brute-forced, so the pepper stays in identity-service. Same number gives the same fingerprint: that is how a
 * card linked to two accounts (BR-23) and a seller's declared number (BR-27) are detected.
 */
@Component
public class IdNumberHasher {

    /** Stored in {@code id_hash_key_ver}; the project only has version 1 (D-08). */
    public static final int KEY_VERSION = 1;

    private static final String ALGORITHM = "HmacSHA256";

    private final String pepper;

    public IdNumberHasher(@Value("${nfc.id-hash-pepper}") String pepper) {
        this.pepper = pepper;
    }

    /** Lower-case hex, 64 characters. {@code idNumber} must already be the 12 digits. */
    public String hash(String idNumber) {
        if (pepper == null || pepper.isBlank()) {
            throw new IllegalStateException("ID_HASH_PEPPER_V1 is not set");
        }
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(new SecretKeySpec(pepper.getBytes(StandardCharsets.UTF_8), ALGORITHM));
            return HexFormat.of().formatHex(mac.doFinal(idNumber.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HMAC-SHA256 is not available", e);
        }
    }

    /** Only the last digits stay visible, e.g. ********1234 (AC-04.12). */
    public static String mask(String idNumber) {
        int hidden = Math.max(0, idNumber.length() - IdCardConstant.MASK_VISIBLE_DIGITS);
        return IdCardConstant.MASK_CHAR.repeat(hidden) + idNumber.substring(hidden);
    }
}
