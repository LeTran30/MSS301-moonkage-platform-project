package com.moonkage.identity.auth.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.account.CredentialCheck;
import com.moonkage.identity.account.LoginIdentifier;
import com.moonkage.identity.account.RawPassword;
import com.moonkage.identity.auth.AuthError;
import com.moonkage.identity.auth.application.port.SessionTokens;
import com.moonkage.identity.profile.FullName;
import com.moonkage.identity.profile.ProfileApi;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.Role;
import com.moonkage.identity.shared.error.AppException;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** FR-02: login answers through AccountApi.verifyCredentials, no Spring Security authentication manager. */
class LoginTest {

    static final AccountView ACCOUNT = new AccountView(
            AccountId.fromStored("6f1c2a4e-8d3b-4f7a-9c21-5b0e7d9a3f10"),
            Email.parse("lan@x.vn"),
            null,
            Role.MEMBER,
            true,
            null);
    static final SessionTokens.Pair TOKENS = new SessionTokens.Pair("access", "refresh");
    static final FullName NAME = new FullName("Nguyen Lan");

    private static final RawPassword PASSWORD = RawPassword.forLogin("secret-123");

    private final AccountApi accountApi = mock(AccountApi.class);
    private final SessionTokens sessionTokens = mock(SessionTokens.class);
    private final ProfileApi profiles = mock(ProfileApi.class);
    private final Login login = new Login(accountApi, new SessionOpener(sessionTokens, profiles));

    @Test
    void acceptedCredentialsOpenASession() {
        when(accountApi.verifyCredentials(LoginIdentifier.parse("lan@x.vn"), PASSWORD))
                .thenReturn(new CredentialCheck.Accepted(ACCOUNT));
        when(sessionTokens.issue(ACCOUNT)).thenReturn(TOKENS);
        when(profiles.findFullName(ACCOUNT.id())).thenReturn(Optional.of(NAME));

        assertEquals(new Session(ACCOUNT, NAME, TOKENS), login.handle(new Login.Command("lan@x.vn", PASSWORD)));
    }

    @Test
    void rejectedCredentialsAreInvalid() {
        when(accountApi.verifyCredentials(any(), any())).thenReturn(new CredentialCheck.Rejected());

        assertError(AuthError.INVALID_CREDENTIALS, "lan@x.vn");
        verify(sessionTokens, never()).issue(any());
    }

    @Test
    void unconfirmedAccountIsNotActivated() {
        when(accountApi.verifyCredentials(any(), any())).thenReturn(new CredentialCheck.NotActivated());

        assertError(AuthError.ACCOUNT_NOT_ACTIVATED, "lan@x.vn");
        verify(sessionTokens, never()).issue(any());
    }

    @ParameterizedTest
    // decision C1: other forms of a number, or an email cut short, belong to no account
    @ValueSource(strings = {"+84912345678", "912345678", "lan@", "not-a-login"})
    void identifierOfNoShapeIsInvalidWithoutAsking(String identifier) {
        assertError(AuthError.INVALID_CREDENTIALS, identifier);
        verify(accountApi, never()).verifyCredentials(any(), any());
    }

    private void assertError(AuthError expected, String identifier) {
        AppException ex = assertThrows(AppException.class, () -> login.handle(new Login.Command(identifier, PASSWORD)));
        assertEquals(expected, ex.getErrorCode());
    }
}
