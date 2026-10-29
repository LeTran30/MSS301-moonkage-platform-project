package com.moonkage.identity.platform.security;

import com.moonkage.identity.shared.error.AppException;
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

/**
 * Reads {@code Authorization: Bearer …}, asks {@link BearerTokenAuthenticator} who it is and puts the caller in the
 * SecurityContext. A missing or refused token is answered through the MVC exception handler, so the body has the
 * usual ApiResponse shape.
 */
@Component
public class BearerTokenFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final UrlPathHelper URL_PATH_HELPER = new UrlPathHelper();

    private final BearerTokenAuthenticator authenticator;
    private final HandlerExceptionResolver resolver;
    private final SecurityProperties securityProperties;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public BearerTokenFilter(
            BearerTokenAuthenticator authenticator,
            @Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver,
            SecurityProperties securityProperties) {
        this.authenticator = authenticator;
        this.resolver = resolver;
        this.securityProperties = securityProperties;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        // path within the application, not the raw URI: behind the gateway the URI carries the /identity-service
        // prefix (the context path, from X-Forwarded-Prefix). Unlike getServletPath() it is also set under MockMvc.
        boolean isPublic = isPublicApi(URL_PATH_HELPER.getPathWithinApplication(request));
        String token = bearerTokenOf(request);
        if (token == null) {
            if (isPublic) {
                filterChain.doFilter(request, response);
            } else {
                resolver.resolveException(
                        request, response, null, new AppException(BearerTokenError.MISSING_BEARER_TOKEN));
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

    private boolean isPublicApi(String path) {
        return securityProperties.getPublicEndpoints().stream().anyMatch(p -> pathMatcher.match(p, path));
    }

    private static String bearerTokenOf(HttpServletRequest request) {
        String header = request.getHeader(AUTHORIZATION_HEADER);
        return StringUtils.hasText(header) && header.startsWith(BEARER_PREFIX)
                ? header.substring(BEARER_PREFIX.length())
                : null;
    }

    private void authenticate(String token, HttpServletRequest request) {
        CurrentUserInfo user = authenticator.authenticate(token);
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(user, null, user.authorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
