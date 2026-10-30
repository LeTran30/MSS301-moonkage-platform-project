package com.moonkage.identity.auth.infrastructure.token;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.auth.AuthError;
import com.moonkage.identity.platform.config.MovableClock;
import com.moonkage.identity.platform.security.BearerTokenError;
import com.moonkage.identity.platform.security.BearerTokenFilter;
import com.moonkage.identity.platform.security.CurrentUserInfo;
import com.moonkage.identity.platform.security.SecurityProperties;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.Role;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.ErrorCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerExceptionResolver;

/** {@link BearerTokenFilter} with the JWT authenticator behind it: what a request with a bearer token meets. */
class JwtBearerAuthenticationTest {

    private static final AccountId ID = AccountId.fromStored("6f1c2a4e-8d3b-4f7a-9c21-5b0e7d9a3f10");
    private static final Email EMAIL = Email.parse("a@x.vn");
    private static final Instant NOW = Instant.parse("2026-10-29T08:00:00Z");

    private final MovableClock clock = new MovableClock(NOW);
    private final JwtSessionTokens tokens = JwtSessionTokensTest.tokens(JwtSessionTokensTest.SECRET, clock);
    private AccountApi accountApi;
    private HandlerExceptionResolver resolver;
    private FilterChain chain;
    private BearerTokenFilter filter;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        accountApi = mock(AccountApi.class);
        resolver = mock(HandlerExceptionResolver.class);
        chain = mock(FilterChain.class);
        SecurityProperties properties = new SecurityProperties();
        properties.setPublicEndpoints(List.of("/api/auth/login"));
        filter = new BearerTokenFilter(new JwtBearerAuthenticator(tokens, accountApi), resolver, properties);
        response = new MockHttpServletResponse();
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void validTokenSetsTheCurrentUser() throws Exception {
        String token = tokenOf(account(true, null));

        filter.doFilter(request("/api/accounts/me/addresses", token), response, chain);

        verify(chain).doFilter(any(), any());
        assertEquals(
                new CurrentUserInfo(ID, EMAIL, Role.MEMBER),
                SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }

    @Test
    void unconfirmedAccountIsRefusedEvenWithAValidToken() throws Exception {
        String token = tokenOf(account(false, null));

        filter.doFilter(request("/api/accounts/me/addresses", token), response, chain);

        assertEquals(AuthError.ACCOUNT_NOT_ACTIVATED, resolvedError());
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    void tokenFromBeforeAPasswordResetIsRefused() throws Exception {
        String token = tokenOf(account(true, NOW.plus(Duration.ofMinutes(10))));

        filter.doFilter(request("/api/accounts/me/addresses", token), response, chain);

        assertEquals(BearerTokenError.TOKEN_INVALID, resolvedError());
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    void tokenOfADeletedAccountIsInvalid() throws Exception {
        String token = tokenOf(account(true, null));
        when(accountApi.find(ID)).thenReturn(Optional.empty());

        filter.doFilter(request("/api/accounts/me/addresses", token), response, chain);

        // 401, not 404: the caller's credential is what is wrong
        assertEquals(BearerTokenError.TOKEN_INVALID, resolvedError());
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    void expiredTokenIsExpired() throws Exception {
        String token = tokenOf(account(true, null));
        clock.advance(JwtSessionTokensTest.ACCESS_LIFETIME.plusSeconds(1));

        filter.doFilter(request("/api/accounts/me/addresses", token), response, chain);

        assertEquals(BearerTokenError.TOKEN_EXPIRED, resolvedError());
    }

    @Test
    void missingTokenOnProtectedPathIsRefused() throws Exception {
        filter.doFilter(request("/api/accounts/me/addresses", null), response, chain);

        assertEquals(BearerTokenError.MISSING_BEARER_TOKEN, resolvedError());
    }

    @Test
    void publicPathWithBadTokenGoesOnAnonymously() throws Exception {
        filter.doFilter(request("/api/auth/login", "not-a-token"), response, chain);

        verify(chain).doFilter(any(), any());
        verify(resolver, never()).resolveException(any(), any(), any(), any());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void publicPathIsMatchedBehindTheGatewayPrefix() throws Exception {
        // via the gateway: /identity-service is the context path (X-Forwarded-Prefix)
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/identity-service/api/auth/login");
        request.setContextPath("/identity-service");

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(any(), any());
        verify(resolver, never()).resolveException(any(), any(), any(), any());
    }

    @Test
    void errorAfterTheFilterIsNotTurnedIntoATokenError() throws Exception {
        String token = tokenOf(account(true, null));
        ServletException downstream = new ServletException("controller failed");
        doThrow(downstream).when(chain).doFilter(any(), any());

        ServletException thrown = assertThrows(
                ServletException.class,
                () -> filter.doFilter(request("/api/accounts/me/addresses", token), response, chain));

        assertSame(downstream, thrown);
        verify(resolver, never()).resolveException(any(), any(), any(), any());
    }

    /** An access token issued now, for an account that {@link AccountApi#find} returns as given. */
    private String tokenOf(AccountView account) {
        when(accountApi.find(ID)).thenReturn(Optional.of(account));
        return tokens.issue(account).accessToken();
    }

    private ErrorCode resolvedError() {
        ArgumentCaptor<Exception> error = ArgumentCaptor.forClass(Exception.class);
        verify(resolver).resolveException(any(), eq(response), any(), error.capture());
        return ((AppException) error.getValue()).getErrorCode();
    }

    private static MockHttpServletRequest request(String path, String token) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", path);
        request.setServletPath(path);
        if (token != null) {
            request.addHeader("Authorization", "Bearer " + token);
        }
        return request;
    }

    private static AccountView account(boolean emailConfirmed, Instant passwordChangedAt) {
        return new AccountView(ID, EMAIL, null, Role.MEMBER, emailConfirmed, passwordChangedAt);
    }
}
