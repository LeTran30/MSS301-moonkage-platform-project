package com.moonkage.identity.security;

import com.moonkage.identity.entity.Account;
import com.moonkage.identity.exception.InvalidCredentialsException;
import com.moonkage.identity.service.TokenService;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    static final List<String> PUBLIC_ENDPOINTS = List.of(
            "/error",
            "/actuator/health",
            // service-to-service (OpenFeign); the gateway blocks /*/internal/** from outside
            "/internal/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/api/auth/register",
            "/api/auth/verify",
            "/api/auth/resend-otp",
            "/api/auth/login",
            "/api/auth/refresh-token",
            "/api/auth/forgot-password/send-otp",
            "/api/auth/forgot-password/reset");

    private final TokenService tokenService;
    private final HandlerExceptionResolver resolver;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public JwtFilter(
            TokenService tokenService, @Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver) {
        this.tokenService = tokenService;
        this.resolver = resolver;
    }

    private boolean isPublicAPI(String uri) {
        return PUBLIC_ENDPOINTS.stream().anyMatch(p -> pathMatcher.match(p, uri));
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        return StringUtils.hasText(header) && header.startsWith(BEARER_PREFIX)
                ? header.substring(BEARER_PREFIX.length())
                : null;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        // servlet path, not the URI: behind the gateway the URI carries the /identity-service prefix
        boolean isPublic = isPublicAPI(request.getServletPath());
        String token = extractJwtFromRequest(request);
        if (token == null) {
            if (isPublic) {
                filterChain.doFilter(request, response);
            } else {
                resolver.resolveException(
                        request, response, null, new InvalidCredentialsException("Thiếu Authorization Bearer token"));
            }
            return;
        }
        try {
            Account account = tokenService.getAccountFromToken(token);
            if (!account.isEnabled() || !account.isAccountNonLocked()) {
                throw new InvalidCredentialsException("Tài khoản đã bị khóa hoặc ngừng hoạt động");
            }
            CurrentUserInfo info = new CurrentUserInfo();
            info.setAccountId(account.getId());
            info.setEmail(account.getEmail());
            info.setRole(account.getRole().getRoleName());

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(info, null, account.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
            filterChain.doFilter(request, response);
        } catch (ExpiredJwtException ex) {
            fail(request, response, filterChain, isPublic, "Token đã hết hạn");
        } catch (Exception ex) {
            fail(request, response, filterChain, isPublic, "Token không hợp lệ");
        }
    }

    private void fail(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain,
            boolean isPublic,
            String message)
            throws ServletException, IOException {
        if (isPublic) {
            chain.doFilter(request, response);
        } else {
            resolver.resolveException(request, response, null, new InvalidCredentialsException(message));
        }
    }
}
