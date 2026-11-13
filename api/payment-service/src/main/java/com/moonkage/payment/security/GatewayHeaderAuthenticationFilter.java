package com.moonkage.payment.security;

import com.moonkage.api.GatewayHeader;
import com.moonkage.api.GatewayRole;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Turns the {@link GatewayHeader} the gateway set from a valid token into a Spring Security caller, so controllers
 * can say who may call them with {@code @PreAuthorize}. The role becomes {@code ROLE_MEMBER} or {@code ROLE_ADMIN}.
 *
 * <p>Same rule as {@link CurrentUserArgumentResolver}: headers missing or naming an unknown role leave the request
 * anonymous, never a guessed caller.
 */
public class GatewayHeaderAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String accountId = request.getHeader(GatewayHeader.ACCOUNT_ID);
        String role = request.getHeader(GatewayHeader.USER_ROLE);
        if (StringUtils.hasText(accountId) && GatewayRole.isKnown(role)) {
            SecurityContextHolder.getContext()
                    .setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                            accountId, null, List.of(new SimpleGrantedAuthority("ROLE_" + role))));
        }
        chain.doFilter(request, response);
    }
}
