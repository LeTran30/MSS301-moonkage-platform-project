package com.moonkage.identity.security;

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
import com.moonkage.identity.platform.security.BearerTokenFilter;
import com.moonkage.identity.platform.security.CurrentUserInfo;
import com.moonkage.identity.platform.security.SecurityProperties;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.Role;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.LegacyError;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
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

    private static final String TOKEN = "access-token";
    private static final String ACCOUNT_ID = "6f1c2a4e-8d3b-4f7a-9c21-5b0e7d9a3f10";
    private static final AccountId ID = AccountId.fromStored(ACCOUNT_ID);
    private static final Email EMAIL = Email.parse("a@x.vn");

    private JwtTokenProvider jwtTokenProvider;
    private AccountApi accountApi;
    private HandlerExceptionResolver resolver;
    private FilterChain chain;
    private BearerTokenFilter filter;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = mock(JwtTokenProvider.class);
        accountApi = mock(AccountApi.class);
        resolver = mock(HandlerExceptionResolver.class);
        chain = mock(FilterChain.class);
        SecurityProperties properties = new SecurityProperties();
        properties.setPublicEndpoints(List.of("/api/auth/login"));
        filter = new BearerTokenFilter(new JwtBearerAuthenticator(jwtTokenProvider, accountApi), resolver, properties);
        response = new MockHttpServletResponse();
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void validTokenSetsTheCurrentUser() throws Exception {
        tokenOf(account(true));

        filter.doFilter(request("/api/addresses", TOKEN), response, chain);

        verify(chain).doFilter(any(), any());
        CurrentUserInfo user = (CurrentUserInfo)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        assertEquals(ACCOUNT_ID, user.accountId());
    }

    @Test
    void unconfirmedAccountIsRefusedEvenWithAValidToken() throws Exception {
        tokenOf(account(false));

        filter.doFilter(request("/api/addresses", TOKEN), response, chain);

        assertEquals(LegacyError.ACCOUNT_NOT_ACTIVATED, resolvedError().getErrorCode());
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    void tokenFromBeforeAPasswordResetIsRefused() throws Exception {
        AccountView account = new AccountView(ID, EMAIL, null, Role.MEMBER, true, Instant.now());
        when(jwtTokenProvider.parseAccessToken(TOKEN))
                .thenReturn(new JwtClaims(ACCOUNT_ID, Instant.now().minusSeconds(3600)));
        when(accountApi.find(ID)).thenReturn(Optional.of(account));

        filter.doFilter(request("/api/addresses", TOKEN), response, chain);

        assertEquals(LegacyError.TOKEN_INVALID, resolvedError().getErrorCode());
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    void tokenOfADeletedAccountIsInvalid() throws Exception {
        when(jwtTokenProvider.parseAccessToken(TOKEN)).thenReturn(new JwtClaims(ACCOUNT_ID, Instant.now()));
        when(accountApi.find(ID)).thenReturn(Optional.empty());

        filter.doFilter(request("/api/addresses", TOKEN), response, chain);

        // 401, not 404: the caller's credential is what is wrong
        assertEquals(LegacyError.TOKEN_INVALID, resolvedError().getErrorCode());
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    void missingTokenOnProtectedPathIsRefused() throws Exception {
        filter.doFilter(request("/api/addresses", null), response, chain);

        assertEquals(LegacyError.MISSING_BEARER_TOKEN, resolvedError().getErrorCode());
    }

    @Test
    void publicPathWithBadTokenGoesOnAnonymously() throws Exception {
        when(jwtTokenProvider.parseAccessToken(TOKEN)).thenThrow(new AppException(LegacyError.TOKEN_EXPIRED));

        filter.doFilter(request("/api/auth/login", TOKEN), response, chain);

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
        tokenOf(account(true));
        ServletException downstream = new ServletException("controller failed");
        doThrow(downstream).when(chain).doFilter(any(), any());

        ServletException thrown = assertThrows(
                ServletException.class, () -> filter.doFilter(request("/api/addresses", TOKEN), response, chain));

        assertSame(downstream, thrown);
        verify(resolver, never()).resolveException(any(), any(), any(), any());
    }

    private void tokenOf(AccountView account) {
        when(jwtTokenProvider.parseAccessToken(TOKEN)).thenReturn(new JwtClaims(ACCOUNT_ID, Instant.now()));
        when(accountApi.find(ID)).thenReturn(Optional.of(account));
    }

    private AppException resolvedError() {
        ArgumentCaptor<Exception> error = ArgumentCaptor.forClass(Exception.class);
        verify(resolver).resolveException(any(), eq(response), any(), error.capture());
        return (AppException) error.getValue();
    }

    private static MockHttpServletRequest request(String path, String token) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", path);
        request.setServletPath(path);
        if (token != null) {
            request.addHeader("Authorization", "Bearer " + token);
        }
        return request;
    }

    private static AccountView account(boolean emailConfirmed) {
        return new AccountView(ID, EMAIL, null, Role.MEMBER, emailConfirmed, null);
    }
}
