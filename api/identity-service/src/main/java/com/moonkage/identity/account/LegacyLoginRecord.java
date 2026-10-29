package com.moonkage.identity.account;

import com.moonkage.identity.shared.value.Text;

/**
 * Transitional: what the Spring Security login needs to check a password itself, until phase 5 replaces it with
 * {@link AccountApi#verifyCredentials} (ĐIỂM DỪNG E). Then the hash no longer leaves the module.
 */
public record LegacyLoginRecord(AccountView account, String passwordHash) {

    @Override
    public String toString() {
        return "LegacyLoginRecord[account=" + account.id() + ", passwordHash=" + Text.HIDDEN + "]";
    }
}
