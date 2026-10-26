package com.moonkage.identity.security;

import com.moonkage.identity.account.AccountService;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.common.exception.AppException;
import com.moonkage.identity.common.exception.ErrorCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;
import org.springframework.web.util.UrlPathHelper;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final UrlPathHelper URL_PATH_HELPER = new UrlPathHelper();

    private final JwtTokenProvider jwtTokenProvider;
    private final AccountService accountService;
    private final HandlerExceptionResolver resolver;
    private final SecurityProperties securityProperties;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public JwtFilter(
            JwtTokenProvider jwtTokenProvider,
            AccountService accountService,
            @Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver,
            SecurityProperties securityProperties) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.accountService = accountService;
        this.resolver = resolver;
        this.securityProperties = securityProperties;
    }

    private boolean isPublicApi(String uri) {
        return securityProperties.getPublicEndpoints().stream().anyMatch(p -> pathMatcher.match(p, uri));
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        String header = request.getHeader(SecurityConstant.AUTHORIZATION_HEADER);
        return StringUtils.hasText(header) && header.startsWith(SecurityConstant.BEARER_PREFIX)
                ? header.substring(SecurityConstant.BEARER_PREFIX.length())
                : null;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        // path within the application, not the raw URI: behind the gateway the URI carries the /identity-service
        // prefix (the context path, from X-Forwarded-Prefix). Unlike getServletPath() it is also set under MockMvc.
        boolean isPublic = isPublicApi(URL_PATH_HELPER.getPathWithinApplication(request));
        String token = extractJwtFromRequest(request);
        if (token == null) {
            if (isPublic) {
                filterChain.doFilter(request, response);
            } else {
                resolver.resolveException(request, response, null, new AppException(ErrorCode.MISSING_BEARER_TOKEN));
            }
            return;
        }
        try {
            authenticate(token, request);
        } catch (AppException ex) {
            // a public endpoint still works with a bad token, just anonymously
            if (!isPublic) {
                resolver.resolveException(request, response, null, ex);
                return;
            }
        }
        // outside the try: errors further down the chain are not token errors and must not become a 401
        filterChain.doFilter(request, response);
    }

    /** Throws AppException (token invalid / expired, account missing, disabled or banned). */
    private void authenticate(String token, HttpServletRequest request) {
        JwtClaims claims = jwtTokenProvider.parseAccessToken(token);
        String accountId = claims.accountId();
        // loaded on every request: a still-valid token must not outlive a password reset or a deleted account.
        // A deleted account makes the token invalid (401), not a missing resource (404)
        AccountView account =
                accountService.findAccount(accountId).orElseThrow(() -> new AppException(ErrorCode.TOKEN_INVALID));
        if (!account.verified()) {
            throw new AppException(ErrorCode.ACCOUNT_NOT_ACTIVATED);
        }
        if (!account.acceptsTokenIssuedAt(claims.issuedAt())) {
            throw new AppException(ErrorCode.TOKEN_INVALID);
        }
        CurrentUserInfo info = new CurrentUserInfo(account.id(), account.email(), account.role());

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(info, null, AccountPrincipal.authoritiesOf(account.role()));
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
