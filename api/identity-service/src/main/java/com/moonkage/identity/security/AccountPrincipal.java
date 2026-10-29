package com.moonkage.identity.security;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.account.LegacyLoginRecord;
import com.moonkage.identity.platform.security.CurrentUserInfo;
import java.util.Collection;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * The account as Spring Security sees it during login (FR-02), until phase 5 replaces this login (ĐIỂM DỪNG E). Built
 * from {@link LegacyLoginRecord}, so the account module does not depend on Spring Security.
 */
public record AccountPrincipal(LegacyLoginRecord credentials) implements UserDetails {

    public AccountView account() {
        return credentials.account();
    }

    @Override
    public String getUsername() {
        return account().email().value();
    }

    @Override
    public String getPassword() {
        return credentials.passwordHash();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return CurrentUserInfo.authoritiesOf(account().role());
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
