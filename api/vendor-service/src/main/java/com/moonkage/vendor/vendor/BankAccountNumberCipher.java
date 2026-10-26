package com.moonkage.vendor.vendor;

import com.moonkage.vendor.vendor.vo.BankAccountNumber;
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
 * Encrypts vendors' bank account numbers before they are stored (NFR-03, P-09): AES-256-GCM with vendor-service's own
 * key, never identity's. Stored bytes = random 12-byte IV followed by the ciphertext and its 16-byte tag. Decrypting
 * is for the payout only and comes with the payout phase.
 */
@Component
class BankAccountNumberCipher {

    /** Stored in {@code pii_key_ver}; only version 1 exists so far. */
    static final int KEY_VERSION = 1;

    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final String KEY_ALGORITHM = "AES";
    private static final int KEY_BYTES = 32;
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final String base64Key;

    /** {@code base64Key}: 32 random bytes, e.g. {@code openssl rand -base64 32}. */
    BankAccountNumberCipher(@Value("${vendor.bank-account.encryption-key}") String base64Key) {
        this.base64Key = base64Key;
    }

    EncryptedBankAccountNumber encrypt(BankAccountNumber number) {
        byte[] iv = new byte[IV_BYTES];
        RANDOM.nextBytes(iv);
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, key(), new GCMParameterSpec(TAG_BITS, iv));
            byte[] sealed = cipher.doFinal(number.value().getBytes(StandardCharsets.UTF_8));
            byte[] stored = ByteBuffer.allocate(IV_BYTES + sealed.length)
                    .put(iv)
                    .put(sealed)
                    .array();
            return new EncryptedBankAccountNumber(stored, KEY_VERSION, number.masked());
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("AES-GCM encryption failed", e);
        }
    }

    /** Throws when the stored bytes were changed or were locked with another key. */
    BankAccountNumber decrypt(byte[] stored) {
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(TAG_BITS, stored, 0, IV_BYTES));
            return BankAccountNumber.of(
                    new String(cipher.doFinal(stored, IV_BYTES, stored.length - IV_BYTES), StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("AES-GCM decryption failed", e);
        }
    }

    private SecretKeySpec key() {
        if (base64Key == null || base64Key.isBlank()) {
            throw new IllegalStateException("BANK_ACCOUNT_ENC_KEY_V1 is not set");
        }
        byte[] key = Base64.getDecoder().decode(base64Key.trim());
        if (key.length != KEY_BYTES) {
            throw new IllegalStateException("BANK_ACCOUNT_ENC_KEY_V1 must be 32 bytes in Base64");
        }
        return new SecretKeySpec(key, KEY_ALGORITHM);
    }
}
