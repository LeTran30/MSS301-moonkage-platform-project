package com.moonkage.identity.auth.infrastructure.web;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.auth.application.Registration;

/**
 * Answer of POST /register.
 *
 * @param phoneNumber the 9 subscriber digits, null when none
 * @param verified email confirmed: always false right after /register
 * @param otpSent false when the confirmation email could not be sent, client offers "resend code" (FR-01)
 */
public record RegisterAccountResponse(String id, String email, String phoneNumber, boolean verified, boolean otpSent) {

    static RegisterAccountResponse from(Registration registration) {
        AccountView account = registration.account();
        return new RegisterAccountResponse(
                account.id().toString(),
                account.email().value(),
                account.phoneNumber() == null ? null : account.phoneNumber().value(),
                account.verified(),
                registration.otpSent());
    }
}
