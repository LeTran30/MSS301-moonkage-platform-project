package com.moonkage.identity.security;

import com.moonkage.identity.account.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AccountStatusUserDetailsChecker;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * How a login checks a password (FR-02). Split from the filter chain in plan v2 phase 3; phase 5 replaces it with the
 * auth module's own credential check (ĐIỂM DỪNG E).
 */
@Configuration
@RequiredArgsConstructor
public class LoginSecurityConfig {

    private final AccountService accountService;

    /** FR-02: log in with email or phone number. */
    @Bean
    public UserDetailsService userDetailsService() {
        return identifier -> accountService
                .findCredentials(identifier)
                .map(AccountPrincipal::new)
                .orElseThrow(() -> new UsernameNotFoundException(identifier));
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService());
        provider.setPasswordEncoder(passwordEncoder());
        // check "e-mail not confirmed" (AccountPrincipal.isEnabled) only AFTER the password matched, so a stranger
        // cannot learn that an email exists from a "not activated" reply (FR-02)
        provider.setPreAuthenticationChecks(user -> {});
        provider.setPostAuthenticationChecks(new AccountStatusUserDetailsChecker());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
