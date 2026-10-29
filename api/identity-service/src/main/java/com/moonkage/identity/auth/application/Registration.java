package com.moonkage.identity.auth.application;

import com.moonkage.identity.account.AccountView;

/**
 * A new account waiting for its email to be confirmed.
 *
 * @param otpSent false when the confirmation mail could not be sent; the client offers "resend code" (FR-01)
 */
public record Registration(AccountView account, boolean otpSent) {}
