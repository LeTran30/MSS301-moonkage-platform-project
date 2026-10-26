package com.moonkage.vendor.vendor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.moonkage.vendor.vendor.vo.BankAccountNumber;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import org.junit.jupiter.api.Test;

class BankAccountNumberCipherTest {

    private static final String KEY = Base64.getEncoder().encodeToString(new byte[32]);

    private final BankAccountNumberCipher cipher = new BankAccountNumberCipher(KEY);

    @Test
    void anEncryptedNumberDecryptsBackAndKeepsOnlyTheMaskedFormInClear() {
        BankAccountNumber number = BankAccountNumber.of("0123456789");

        EncryptedBankAccountNumber encrypted = cipher.encrypt(number);

        assertEquals(number, cipher.decrypt(encrypted.ciphertext()));
        assertEquals("******6789", encrypted.masked());
        assertEquals(BankAccountNumberCipher.KEY_VERSION, encrypted.keyVersion());
        assertFalse(new String(encrypted.ciphertext(), StandardCharsets.ISO_8859_1).contains("0123456789"));
    }

    @Test
    void theSameNumberEncryptsDifferentlyEachTime() {
        BankAccountNumber number = BankAccountNumber.of("0123456789");

        assertFalse(Arrays.equals(
                cipher.encrypt(number).ciphertext(), cipher.encrypt(number).ciphertext()));
    }

    @Test
    void withoutAKeyNothingIsEncrypted() {
        BankAccountNumberCipher withoutKey = new BankAccountNumberCipher("");

        assertThrows(IllegalStateException.class, () -> withoutKey.encrypt(BankAccountNumber.of("0123456789")));
    }
}
