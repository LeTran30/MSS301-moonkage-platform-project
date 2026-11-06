package com.moonkage.gateway.config;

import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * The rate limits of the gateway (BE-07).
 *
 * <p>The gateway is the only entry point, so a limit here protects every service at once. The limits are per rule
 * and not global: a caller who floods the login endpoint must not be able to block the catalogue.
 *
 * <p>A rule is disabled when its rate is not positive, so a deployment can turn one off without a code change.
 */
@ConfigurationProperties(prefix = "moonkage.rate-limit")
public record RateLimitProperties(
        @DefaultValue("false") boolean enabled,
        @DefaultValue Rules rules) {

    /**
     * The rules, each with its own rate and window.
     *
     * @param replenishPeriod how long the bucket is filled up again
     * @param requestedTokens how many calls are allowed per period (0 disables the rule)
     * @param keyByAccount whether the caller is counted by account (needs a token) instead of by IP
     */
    public record Rules(
            @DefaultValue("10") int login,
            @DefaultValue("5") int otp,
            @DefaultValue("10") int nfc,
            @DefaultValue("120") int ipn,
            @DefaultValue("60") int registration,
            @DefaultValue("60s") Duration replenishPeriod,
            @DefaultValue("true") boolean keyByAccount) {

        /** The rule of a path, or null when the path is not limited. */
        public Rule resolve(String path, String method) {
            String upper = method == null ? "" : method.toUpperCase();
            if (!"POST".equals(upper)) {
                return null;
            }
            if (path.endsWith("/api/auth/login")) {
                return new Rule(login, "login");
            }
            if (path.contains("/api/auth/") && path.contains("otp")) {
                return new Rule(otp, "otp");
            }
            if (path.endsWith("/api/auth/register")) {
                return new Rule(registration, "registration");
            }
            if (path.startsWith("/api/nfc/") || path.contains("/api/nfc/")) {
                return new Rule(nfc, "nfc");
            }
            if (path.contains("/vnpay/ipn")) {
                return new Rule(ipn, "ipn");
            }
            return null;
        }
    }

    /**
     * One limit.
     *
     * @param calls how many calls are allowed per period
     * @param name the name of the rule, used as a metric tag and in the log
     */
    public record Rule(int calls, String name) {
        public boolean enabled() {
            return calls > 0;
        }
    }

    /** The rules that are limited, in the order they are checked. */
    public List<Rule> all() {
        return List.of(
                new Rule(rules.login(), "login"),
                new Rule(rules.otp(), "otp"),
                new Rule(rules.registration(), "registration"),
                new Rule(rules.nfc(), "nfc"),
                new Rule(rules.ipn(), "ipn"));
    }
}
