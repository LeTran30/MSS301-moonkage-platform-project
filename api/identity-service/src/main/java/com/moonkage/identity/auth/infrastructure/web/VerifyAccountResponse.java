package com.moonkage.identity.auth.infrastructure.web;

import com.moonkage.identity.account.AccountView;

/**
 * Answer of POST /verify-account.
 *
 * @param phoneNumber the 9 subscriber digits, null when none
 * @param verified email confirmed: always true here, kept so the client reads the same field as after /register
 */
public record VerifyAccountResponse(String id, String email, String phoneNumber, boolean verified) {

    static VerifyAccountResponse from(AccountView account) {
        return new VerifyAccountResponse(
                account.id().toString(),
                account.email().value(),
                account.phoneNumber() == null ? null : account.phoneNumber().value(),
                account.verified());
    }
}
