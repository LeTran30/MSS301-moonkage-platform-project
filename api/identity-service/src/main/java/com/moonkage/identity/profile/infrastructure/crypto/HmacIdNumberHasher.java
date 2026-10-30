package com.moonkage.identity.profile.infrastructure.crypto;

import com.moonkage.identity.profile.IdNumberHash;
import com.moonkage.identity.profile.application.port.IdNumberHasher;
import com.moonkage.identity.shared.CitizenId;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * HMAC-SHA256 with a secret pepper (NFR-03, D-07): a plain hash of 12 digits could be brute-forced. The dev seed
 * (db/seed/R__seed.sql) computes the same value in SQL, so both must change together.
 */
@Component
class HmacIdNumberHasher implements IdNumberHasher {

    /** The project only has version 1 (D-08). */
    private static final int KEY_VERSION = 1;

    private static final String ALGORITHM = "HmacSHA256";

    private final String pepper;

    HmacIdNumberHasher(@Value("${nfc.id-hash-pepper}") String pepper) {
        this.pepper = pepper;
    }

    @Override
    public IdNumberHash hash(CitizenId idNumber) {
        if (pepper == null || pepper.isBlank()) {
            throw new IllegalStateException("ID_HASH_PEPPER_V1 is not set");
        }
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(new SecretKeySpec(pepper.getBytes(StandardCharsets.UTF_8), ALGORITHM));
            return new IdNumberHash(
                    HexFormat.of().formatHex(mac.doFinal(idNumber.value().getBytes(StandardCharsets.UTF_8))));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HMAC-SHA256 is not available", e);
        }
    }

    @Override
    public int keyVersion() {
        return KEY_VERSION;
    }
}
