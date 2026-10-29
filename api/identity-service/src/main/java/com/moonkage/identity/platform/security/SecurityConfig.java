package com.moonkage.identity.platform.security;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Stateless filter chain: public paths from {@code security.public-endpoints}, everything else needs a bearer token.
 * Knows neither JWT nor accounts (plan v2, 6.1); how a login checks a password is configured by the module that
 * owns logins.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final BearerTokenFilter bearerTokenFilter;
    private final SecurityProperties securityProperties;

    /** The filter is a @Component: stop Boot from also registering it as a servlet filter (it would run twice). */
    @Bean
    public FilterRegistrationBean<BearerTokenFilter> bearerTokenFilterRegistration(BearerTokenFilter filter) {
        FilterRegistrationBean<BearerTokenFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.requestMatchers(
                                securityProperties.getPublicEndpoints().toArray(String[]::new))
                        .permitAll()
                        .anyRequest()
                        .authenticated())
                .addFilterBefore(bearerTokenFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
