package com.moonkage.observability;

import io.micrometer.common.KeyValue;
import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationFilter;
import java.util.Locale;
import java.util.Set;

/**
 * Masks the personal data before it lands in a span (NFR-03, RT-03).
 *
 * <p>A trace is the one place where personal data piles up without anyone looking: the span of an HTTP request
 * carries the URL, the span of a RabbitMQ message carries the routing key, and a service can add any key value it
 * likes. A log line is read by a human who is told not to copy it; a span is exported to a collector and kept for
 * days. So the same rule as the log applies here: what is enough to tell two callers apart, not enough to identify
 * one.
 *
 * <p>This is an {@link ObservationFilter} and not an {@code ObservationHandler} on purpose. Micrometer runs the
 * filters of an observation <em>before</em> its handlers, and the tracing handler is the one that copies the key
 * values onto the span. A filter therefore masks the values before anything can read them - there is no ordering to
 * get wrong and no dependency on the order the handlers happen to be registered in.
 *
 * <p>The masking is decided by the <em>name</em> of the key value. A key called {@code email} holds an e-mail
 * address, so it is masked as one; a key called {@code phone} holds a phone number, so it is masked as one. Two
 * safety nets cover the case where the name says nothing: a value that is <em>entirely</em> an e-mail address or
 * <em>entirely</em> a phone number is masked whatever its name is, and the query string of a URL is masked
 * parameter by parameter.
 */
public final class PiiMaskingObservationFilter implements ObservationFilter {

    /** The key names whose value is an e-mail address. */
    private static final Set<String> EMAIL_KEYS = Set.of("email", "e_mail", "mail", "emailaddress", "email_address");

    /** The key names whose value is a phone number. */
    private static final Set<String> PHONE_KEYS = Set.of("phone", "phonenumber", "phone_number", "mobile", "msisdn");

    /** The key names whose value is a secret and must never appear at all. */
    private static final Set<String> SECRET_KEYS =
            Set.of("password", "passwd", "pwd", "secret", "token", "authorization", "auth", "apikey", "api_key");

    /** The key names whose value is a national identity number. */
    private static final Set<String> ID_NUMBER_KEYS =
            Set.of("idnumber", "id_number", "nationalid", "national_id", "identitynumber", "identity_number");

    /** The key names whose value is a URL and whose query string may carry personal data. */
    private static final Set<String> URL_KEYS = Set.of(
            "uri",
            "url",
            "httpurl",
            "http_url",
            "requesturi",
            "request_uri",
            "http.url",
            "http.url.full",
            "url.full",
            "http.uri",
            "http.request.uri",
            "http.target",
            "http.target.path");

    /** The suffixes of a key name that mean the value is a URL. */
    private static final Set<String> URL_KEY_SUFFIXES = Set.of(".uri", ".url", "_uri", "_url", "-uri", "-url");

    /** What a value of an unknown kind is replaced with: the kind of data is not recorded either. */
    private static final String REDACTED = "[redacted]";

    /** What a secret is replaced with. */
    private static final String SECRET_REDACTED = "[secret]";

    /** The smallest number of digits that can be a phone number. */
    private static final int MIN_PHONE_DIGITS = 9;

    /** The biggest number of digits that can be a phone number. */
    private static final int MAX_PHONE_DIGITS = 15;

    /**
     * Masks the key values of the context in place.
     *
     * <p>The context is mutated and returned, because the tracing handler reads the very same object when it tags
     * the span.
     *
     * @param context the observation context
     * @return the masked context
     */
    @Override
    public Observation.Context map(Observation.Context context) {
        for (KeyValue keyValue : context.getAllKeyValues()) {
            String masked = mask(keyValue.getKey(), keyValue.getValue());
            if (masked.equals(keyValue.getValue())) {
                continue;
            }
            KeyValue replacement = KeyValue.of(keyValue.getKey(), masked);
            if (context.getLowCardinalityKeyValue(keyValue.getKey()) != null) {
                context.addLowCardinalityKeyValue(replacement);
            }
            if (context.getHighCardinalityKeyValue(keyValue.getKey()) != null) {
                context.addHighCardinalityKeyValue(replacement);
            }
        }
        return context;
    }

    /**
     * The masked form of a value, decided by the name of its key.
     *
     * @param key the name of the key value
     * @param value the value to mask
     * @return the masked value, or the value itself when it holds nothing personal
     */
    static String mask(String key, String value) {
        if (key == null || value == null || value.isEmpty()) {
            return value;
        }
        String normalized = key.toLowerCase(Locale.ROOT).replace('-', '_');
        String compact = normalized.replace("_", "");
        if (matches(SECRET_KEYS, normalized, compact)) {
            return SECRET_REDACTED;
        }
        if (matches(EMAIL_KEYS, normalized, compact)) {
            return PiiMasker.maskEmail(value);
        }
        if (matches(PHONE_KEYS, normalized, compact)) {
            return PiiMasker.maskPhone(value);
        }
        if (matches(ID_NUMBER_KEYS, normalized, compact)) {
            return REDACTED;
        }
        if (isUrlKey(normalized, compact)) {
            return maskUrl(value);
        }
        // the safety net: a value that is nothing but an e-mail address or a phone number is personal data
        // whatever the key is called
        if (looksLikeEmail(value)) {
            return PiiMasker.maskEmail(value);
        }
        if (looksLikePhone(value)) {
            return PiiMasker.maskPhone(value);
        }
        return value;
    }

    /** Whether the name of the key says the value is a URL. */
    private static boolean isUrlKey(String normalized, String compact) {
        if (matches(URL_KEYS, normalized, compact)) {
            return true;
        }
        for (String suffix : URL_KEY_SUFFIXES) {
            if (normalized.endsWith(suffix)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Masks the personal data a URL can carry.
     *
     * <p>The URL is first tried as a whole: when the whole thing is an e-mail address or a phone number (a URL
     * key whose value is really a bare personal datum), it is masked as one. Otherwise the query string is masked
     * parameter by parameter.
     */
    private static String maskUrl(String value) {
        if (looksLikeEmail(value)) {
            return PiiMasker.maskEmail(value);
        }
        if (looksLikePhone(value)) {
            return PiiMasker.maskPhone(value);
        }
        return maskQueryString(value);
    }

    /** Whether the name of the key is one of the given names, with or without the underscores. */
    private static boolean matches(Set<String> names, String normalized, String compact) {
        return names.contains(normalized) || names.contains(compact);
    }

    /**
     * Masks the personal parameters of the query string of a URL and leaves the rest of the URL alone.
     *
     * <p>The path is kept as it is: it says which resource was called, which is what the trace is for. Only the
     * parameters that carry personal data are masked, so {@code ?page=2&sort=name} survives untouched.
     */
    private static String maskQueryString(String value) {
        int questionMark = value.indexOf('?');
        if (questionMark < 0) {
            return value;
        }
        String before = value.substring(0, questionMark);
        String query = value.substring(questionMark + 1);
        StringBuilder masked = new StringBuilder(before).append('?');
        String[] parameters = query.split("&", -1);
        for (int index = 0; index < parameters.length; index++) {
            if (index > 0) {
                masked.append('&');
            }
            String parameter = parameters[index];
            int equals = parameter.indexOf('=');
            if (equals < 0) {
                masked.append(parameter);
                continue;
            }
            String name = parameter.substring(0, equals);
            String parameterValue = parameter.substring(equals + 1);
            String maskedValue = mask(name, parameterValue);
            masked.append(name).append('=').append(maskedValue);
        }
        return masked.toString();
    }

    /**
     * Whether the value is an e-mail address and nothing else.
     *
     * <p>The test is deliberately strict: one {@code @}, something before it, a domain with a dot after it. A value
     * that only looks a bit like an e-mail address (a sentence with an {@code @} in it) is left alone, because
     * masking it would lose information without protecting anyone.
     *
     * <p>The domain has to look like a domain too: letters, digits, dots and dashes only. Without that check a URL
     * like {@code https://host/api?email=a@b.com} would pass, because its domain part would be
     * {@code b.com&page=2} - and masking the whole URL as one e-mail address would hide the path while leaving
     * the rest of the query string readable.
     */
    private static boolean looksLikeEmail(String value) {
        int at = value.indexOf('@');
        if (at <= 0 || at != value.lastIndexOf('@') || at == value.length() - 1) {
            return false;
        }
        String domain = value.substring(at + 1);
        int dot = domain.indexOf('.');
        if (dot <= 0 || dot >= domain.length() - 1) {
            return false;
        }
        String local = value.substring(0, at);
        if (!isPlainWord(local) || !isPlainDomain(domain)) {
            return false;
        }
        return true;
    }

    /** Whether the text holds only the characters a local part of an e-mail address may hold. */
    private static boolean isPlainWord(String text) {
        for (int index = 0; index < text.length(); index++) {
            char character = text.charAt(index);
            boolean allowed = Character.isLetterOrDigit(character)
                    || character == '.'
                    || character == '_'
                    || character == '-'
                    || character == '+';
            if (!allowed) {
                return false;
            }
        }
        return !text.isEmpty();
    }

    /** Whether the text holds only the characters a domain may hold. */
    private static boolean isPlainDomain(String text) {
        for (int index = 0; index < text.length(); index++) {
            char character = text.charAt(index);
            boolean allowed = Character.isLetterOrDigit(character) || character == '.' || character == '-';
            if (!allowed) {
                return false;
            }
        }
        return !text.isEmpty();
    }

    /**
     * Whether the value is a phone number and nothing else.
     *
     * <p>Only digits (with the usual separators) count, and only within the range a phone number can have.
     */
    private static boolean looksLikePhone(String value) {
        int digits = 0;
        for (int index = 0; index < value.length(); index++) {
            char character = value.charAt(index);
            if (Character.isDigit(character)) {
                digits++;
            } else if (character != ' ' && character != '-' && character != '+' && character != '.') {
                return false;
            }
        }
        return digits >= MIN_PHONE_DIGITS && digits <= MAX_PHONE_DIGITS;
    }
}
