package com.moonkage.identity.kyc;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Locks the ID number and date of birth before they are stored (AC-04.11, D-17): AES-256-GCM. Stored bytes = random
 * 12-byte IV followed by the ciphertext and its 16-byte tag.
 */
@Component
class PiiCipher {

    /** Stored in {@code pii_key_ver}; the project only has version 1 (D-17). */
    public static final int KEY_VERSION = 1;

    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int KEY_BYTES = 32;
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final String base64Key;

    /** {@code base64Key}: 32 random bytes, e.g. {@code openssl rand -base64 32}. */
    public PiiCipher(@Value("${nfc.pii-key}") String base64Key) {
        this.base64Key = base64Key;
    }

    public byte[] encrypt(String plaintext) {
        byte[] iv = new byte[IV_BYTES];
        RANDOM.nextBytes(iv);
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, key(), new GCMParameterSpec(TAG_BITS, iv));
            byte[] sealed = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            return ByteBuffer.allocate(IV_BYTES + sealed.length)
                    .put(iv)
                    .put(sealed)
                    .array();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("AES-GCM encryption failed", e);
        }
    }

    /** Throws when the stored bytes were changed or were locked with another key. */
    public String decrypt(byte[] data) {
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(TAG_BITS, data, 0, IV_BYTES));
            return new String(cipher.doFinal(data, IV_BYTES, data.length - IV_BYTES), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("AES-GCM decryption failed", e);
        }
    }

    private SecretKeySpec key() {
        if (base64Key == null || base64Key.isBlank()) {
            throw new IllegalStateException("PII_ENC_KEY_V1 is not set");
        }
        byte[] key = Base64.getDecoder().decode(base64Key.trim());
        if (key.length != KEY_BYTES) {
            throw new IllegalStateException("PII_ENC_KEY_V1 must be 32 bytes in Base64");
        }
        return new SecretKeySpec(key, "AES");
    }
}
