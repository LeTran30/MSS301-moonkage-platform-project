package com.moonkage.vendor.vendor;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Bank account in the vendor's name (AC-26.1). The number is stored encrypted (AES-GCM, NFR-03, P-09) and shown only
 * masked; it is decrypted for a payout. Rows from before the migration have the masked form only.
 */
@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
class BankAccount {

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "bank_account_number_enc")
    private byte[] encryptedNumber;

    @Column(name = "bank_account_masked", length = 20)
    private String maskedNumber;

    /** Key version of {@link #encryptedNumber}; null exactly when the number is null (ck_vendors_bank_account_enc). */
    @Column(name = "pii_key_ver")
    private Integer keyVersion;

    @Column(name = "bank_account_holder")
    private String holder;

    static BankAccount of(String bankName, String holder, EncryptedBankAccountNumber number) {
        return new BankAccount(bankName, number.ciphertext(), number.masked(), number.keyVersion(), holder);
    }
}
