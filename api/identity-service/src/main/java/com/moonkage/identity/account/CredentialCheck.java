package com.moonkage.identity.account;

/** The answer of {@link AccountApi#verifyCredentials} (FR-02). */
public sealed interface CredentialCheck {

    /** The password matched a confirmed account. */
    record Accepted(AccountView account) implements CredentialCheck {}

    /** The password matched, but the email is not confirmed yet. Never given for a wrong password. */
    record NotActivated() implements CredentialCheck {}

    /** Wrong password or no such account: the two cannot be told apart. */
    record Rejected() implements CredentialCheck {}
}
