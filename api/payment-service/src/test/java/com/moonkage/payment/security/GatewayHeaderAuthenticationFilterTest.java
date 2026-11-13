package com.moonkage.payment.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.moonkage.api.GatewayHeader;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

class GatewayHeaderAuthenticationFilterTest {

    private final GatewayHeaderAuthenticationFilter filter = new GatewayHeaderAuthenticationFilter();

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private Authentication run(String accountId, String role) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        if (accountId != null) {
            request.addHeader(GatewayHeader.ACCOUNT_ID, accountId);
        }
        if (role != null) {
            request.addHeader(GatewayHeader.USER_ROLE, role);
        }
        AtomicReference<Authentication> seen = new AtomicReference<>();
        filter.doFilter(
                request,
                new MockHttpServletResponse(),
                (req, res) -> seen.set(SecurityContextHolder.getContext().getAuthentication()));
        return seen.get();
    }

    @Test
    void theGatewayHeadersBecomeTheCallerAndItsRole() throws Exception {
        Authentication caller = run("acc-1", "ADMIN");

        assertThat(caller.getName()).isEqualTo("acc-1");
        assertThat(caller.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_ADMIN");
    }

    @Test
    void missingOrUnknownHeadersLeaveTheRequestAnonymous() throws Exception {
        assertThat(run(null, null)).isNull();
        assertThat(run("acc-1", null)).isNull();
        assertThat(run("acc-1", "ROOT")).isNull();
        assertThat(run(null, "ADMIN")).isNull();
    }
}
