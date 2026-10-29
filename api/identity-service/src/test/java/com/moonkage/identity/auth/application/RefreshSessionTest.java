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
import com.moonkage.identity.auth.AuthError;
import com.moonkage.identity.auth.application.port.SessionTokens;
import com.moonkage.identity.profile.ProfileApi;
import com.moonkage.identity.shared.Role;
import com.moonkage.identity.shared.error.AppException;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class RefreshSessionTest {

    private static final AccountView ACCOUNT = LoginTest.ACCOUNT;
    private static final Instant ISSUED = Instant.parse("2026-10-29T08:00:00Z");

    private final AccountApi accountApi = mock(AccountApi.class);
    private final SessionTokens sessionTokens = mock(SessionTokens.class);
    private final ProfileApi profiles = mock(ProfileApi.class);
    private final RefreshSession refresh =
            new RefreshSession(sessionTokens, accountApi, new SessionOpener(sessionTokens, profiles));

    @Test
    void validTokenOfAConfirmedAccountOpensANewSession() {
        claims(ACCOUNT.id().toString());
        when(accountApi.find(ACCOUNT.id())).thenReturn(Optional.of(ACCOUNT));
        when(sessionTokens.issue(ACCOUNT)).thenReturn(LoginTest.TOKENS);
        when(profiles.findFullName(ACCOUNT.id())).thenReturn(Optional.of(LoginTest.NAME));

        assertEquals(new Session(ACCOUNT, LoginTest.NAME, LoginTest.TOKENS), refresh.handle("rt"));
    }

    @Test
    void tokenOfADeletedAccountIsInvalid() {
        claims(ACCOUNT.id().toString());
        when(accountApi.find(ACCOUNT.id())).thenReturn(Optional.empty());

        assertError(AuthError.REFRESH_TOKEN_INVALID);
    }

    @Test
    void subjectThatIsNoUuidIsInvalid() {
        claims("not-a-uuid");

        assertError(AuthError.REFRESH_TOKEN_INVALID);
        verify(accountApi, never()).find(any());
    }

    @Test
    void unconfirmedAccountIsNotActivated() {
        claims(ACCOUNT.id().toString());
        when(accountApi.find(ACCOUNT.id())).thenReturn(Optional.of(withState(false, null)));

        assertError(AuthError.ACCOUNT_NOT_ACTIVATED);
    }

    @Test
    void tokenFromBeforeAPasswordResetIsInvalid() {
        claims(ACCOUNT.id().toString());
        when(accountApi.find(ACCOUNT.id())).thenReturn(Optional.of(withState(true, ISSUED.plusSeconds(3600))));

        assertError(AuthError.REFRESH_TOKEN_INVALID);
    }

    private void claims(String subject) {
        when(sessionTokens.readRefreshToken("rt")).thenReturn(new SessionTokens.Claims(subject, ISSUED));
    }

    private void assertError(AuthError expected) {
        assertEquals(
                expected,
                assertThrows(AppException.class, () -> refresh.handle("rt")).getErrorCode());
        verify(sessionTokens, never()).issue(any());
    }

    private static AccountView withState(boolean verified, Instant passwordChangedAt) {
        return new AccountView(ACCOUNT.id(), ACCOUNT.email(), null, Role.MEMBER, verified, passwordChangedAt);
    }
}
