package com.moonkage.vendor.vendor;

/** A bank account number as it is stored: AES-GCM ciphertext, its key version, and the masked form (P-09). */
record EncryptedBankAccountNumber(byte[] ciphertext, int keyVersion, String masked) {}
