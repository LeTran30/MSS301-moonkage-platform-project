package com.moonkage.identity.security;

import com.moonkage.identity.account.atom.Role;
import com.moonkage.identity.account.dto.AccountCredentials;
import com.moonkage.identity.account.dto.AccountView;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * The account as Spring Security sees it during login (FR-02). Built from {@link AccountCredentials}, so the Account
 * entity does not depend on Spring Security.
 */
public record AccountPrincipal(AccountCredentials credentials) implements UserDetails {

    public static List<GrantedAuthority> authoritiesOf(Role role) {
        return List.of(new SimpleGrantedAuthority(SecurityConstant.ROLE_PREFIX + role.name()));
    }

    public AccountView account() {
        return credentials.account();
    }

    @Override
    public String getUsername() {
        return account().email();
    }

    @Override
    public String getPassword() {
        return credentials.passwordHash().hash();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authoritiesOf(account().role());
    }

    @Override
    public boolean isEnabled() {
        return account().verified();
    }

    @Override
    public String toString() {
        return "AccountPrincipal[" + account().id() + "]";
    }
}
