package com.moonkage.identity.platform.security;

import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.Role;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

/** Injected into controllers via @CurrentUser; built once per request by {@link BearerTokenFilter}. */
public record CurrentUserInfo(AccountId accountId, Email email, Role role) {

    private static final String ROLE_PREFIX = "ROLE_";

    /** What Spring Security checks {@code hasRole(...)} against. */
    public static List<GrantedAuthority> authoritiesOf(Role role) {
        return List.of(new SimpleGrantedAuthority(ROLE_PREFIX + role.name()));
    }

    public List<GrantedAuthority> authorities() {
        return authoritiesOf(role);
    }
}
