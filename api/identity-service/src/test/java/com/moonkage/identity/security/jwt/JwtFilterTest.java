package com.moonkage.identity.security.jwt;

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

import com.moonkage.identity.entity.Account;
import com.moonkage.identity.exception.AppException;
import com.moonkage.identity.exception.ErrorCode;
import com.moonkage.identity.repository.AccountRepository;
import com.moonkage.identity.security.CurrentUserInfo;
import com.moonkage.identity.security.SecurityProperties;
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

class JwtFilterTest {

    private static final String TOKEN = "access-token";
    private static final String ACCOUNT_ID = "acc-1";

    private JwtTokenProvider jwtTokenProvider;
    private AccountRepository accountRepository;
    private HandlerExceptionResolver resolver;
    private FilterChain chain;
    private JwtFilter filter;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = mock(JwtTokenProvider.class);
        accountRepository = mock(AccountRepository.class);
        resolver = mock(HandlerExceptionResolver.class);
        chain = mock(FilterChain.class);
        SecurityProperties properties = new SecurityProperties();
        properties.setPublicEndpoints(List.of("/api/auth/login"));
        filter = new JwtFilter(jwtTokenProvider, accountRepository, resolver, properties);
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

        assertEquals(ErrorCode.ACCOUNT_NOT_ACTIVATED, resolvedError().getErrorCode());
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    void tokenFromBeforeAPasswordResetIsRefused() throws Exception {
        Account account = account(true);
        account.setPasswordChangedAt(Instant.now());
        when(jwtTokenProvider.parseAccessToken(TOKEN))
                .thenReturn(new JwtClaims(ACCOUNT_ID, Instant.now().minusSeconds(3600)));
        when(accountRepository.findById(ACCOUNT_ID)).thenReturn(Optional.of(account));

        filter.doFilter(request("/api/addresses", TOKEN), response, chain);

        assertEquals(ErrorCode.TOKEN_INVALID, resolvedError().getErrorCode());
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    void missingAccountKeepsItsMessageArgument() throws Exception {
        when(jwtTokenProvider.parseAccessToken(TOKEN)).thenReturn(new JwtClaims(ACCOUNT_ID, Instant.now()));
        when(accountRepository.findById(ACCOUNT_ID)).thenReturn(Optional.empty());

        filter.doFilter(request("/api/addresses", TOKEN), response, chain);

        AppException error = resolvedError();
        assertEquals(ErrorCode.ACCOUNT_NOT_FOUND, error.getErrorCode());
        assertEquals(ACCOUNT_ID, error.getArgs()[0]);
    }

    @Test
    void missingTokenOnProtectedPathIsRefused() throws Exception {
        filter.doFilter(request("/api/addresses", null), response, chain);

        assertEquals(ErrorCode.MISSING_BEARER_TOKEN, resolvedError().getErrorCode());
    }

    @Test
    void publicPathWithBadTokenGoesOnAnonymously() throws Exception {
        when(jwtTokenProvider.parseAccessToken(TOKEN)).thenThrow(new AppException(ErrorCode.TOKEN_EXPIRED));

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

    private void tokenOf(Account account) {
        when(jwtTokenProvider.parseAccessToken(TOKEN)).thenReturn(new JwtClaims(ACCOUNT_ID, Instant.now()));
        when(accountRepository.findById(ACCOUNT_ID)).thenReturn(Optional.of(account));
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

    private static Account account(boolean emailConfirmed) {
        return Account.builder()
                .id(ACCOUNT_ID)
                .email("a@x.vn")
                .accountVerified(emailConfirmed)
                .build();
    }
}
